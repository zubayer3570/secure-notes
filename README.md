# Secure Notes API

Note-taking REST API with JWT auth and user/admin roles, plus a small React frontend.

- `apps/api`: Express 5, Mongoose, zod, bcrypt, jsonwebtoken
- `apps/web`: React 19 + Vite

## Setup

```bash
docker compose up -d                      # local MongoDB, skip if you use Atlas
cp apps/api/.env.example apps/api/.env    # set MONGODB_URI and JWT_SECRET (32+ chars)
pnpm install
pnpm seed       # clears the db, syncs indexes, inserts 100 users, 50 posts, 990 notes
pnpm dev        # api on :3000, web on :5173
```

Other scripts:

- `pnpm explain` prints the query plan of every query and both aggregations
- `pnpm check` runs lint, format check, typecheck and build (same as CI)

Seeded logins:

- admins: `admin@example.com`, `admin2@example.com` ... `admin5@example.com` / `Admin12345!`
- users: `alice@example.com`, `bob@example.com`, `carol@example.com`, `user0@example.com` ... `user91@example.com` / `Password123!`

The admin from `.env` is also created on startup if it doesn't exist.

## Deploy

`render.yaml` sets up a single free Render web service. The API serves the built frontend, so there's no CORS setup.

1. New > Blueprint in Render, pick the repo
2. Set `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (`JWT_SECRET` is generated)
3. Allow `0.0.0.0/0` in Atlas network access, free Render instances have no static IP
4. Run `pnpm seed` against the same db if it's empty

Free instances sleep after 15 minutes idle, the first request after that is slow.

## Roles

| | user | admin |
| --- | --- | --- |
| CRUD own notes | yes | yes |
| Read any note, list all notes | | yes |
| Manage users | | yes |
| Read posts, create posts, delete own posts | yes | yes |
| Delete any post | | yes |

The token only holds the user id. The user is loaded from the db on every request, so role changes and deleted accounts apply right away. Notes you don't own return 404.

## API

Everything except `/api/auth/*` needs `Authorization: Bearer <token>`.

| Method | Path | Access | |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | `{ name, email, password, interests? }` |
| POST | `/api/auth/login` | public | returns `{ token, user }` |
| GET, PATCH | `/api/users/me` | any | `name`, `interests`, `password` |
| GET | `/api/users/grouped-by-interest?usersLimit=10` | any | aggregation 1 |
| GET | `/api/users/grouped-by-interest/:interest/users` | any | all users of one interest |
| GET | `/api/users/:id/posts` | any | aggregation 2 |
| GET, POST | `/api/notes` | any | own notes |
| GET | `/api/notes/:id` | owner, admin | |
| PATCH, DELETE | `/api/notes/:id` | owner | |
| GET, POST | `/api/posts` | any | |
| DELETE | `/api/posts/:id` | author, admin | |
| GET, POST | `/api/admin/users` | admin | |
| GET, PATCH, DELETE | `/api/admin/users/:id` | admin | delete also removes their notes and posts |
| GET | `/api/admin/notes?owner=<id>` | admin | |

### Pagination

All lists take `?page=1&limit=20` (limit max 100) and return:

```json
{ "items": [], "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
```

Lists are sorted by `_id` descending, which is creation order, so no extra index is needed for sorting. Filtered lists count with `countDocuments`, unfiltered ones with `estimatedDocumentCount`. Page query and count run in parallel.

`skip` still walks the skipped index keys (page 3 of 20 reads 60 keys, 20 docs). Fine at this size; cursor pagination would be the next step for deep pages.

## Indexes

All indexes are declared with `schema.index()` in `apps/api/src/models`. `pnpm db:sync-indexes` drops anything not declared there.

| Collection | Index | Used by |
| --- | --- | --- |
| users | `{ email: 1 }` unique | login, unique email |
| users | `{ interests: 1, name: 1, _id: 1 }` | users of one interest sorted by name + count, `$match` of aggregation 1 |
| notes | `{ owner: 1, _id: -1 }` | own notes list and count, admin filter by owner, delete on user removal |
| posts | `{ author: 1, _id: -1 }` | `$lookup` in aggregation 2, delete on user removal |

Everything else (auth lookup, get/update/delete by id, feeds) uses the default `_id` index.

Not added on purpose:

- `createdAt`: sorting by `_id` gives the same order
- `{ owner: 1 }`: it's a prefix of `{ owner: 1, _id: -1 }`
- `{ _id, owner }` for note update/delete: `_id` already finds the one document
- `role`: nothing filters by it

## Aggregations

`apps/api/src/aggregations.ts`

### 1. Users grouped by interest

```js
[
  { $match: { interests: { $gte: '' } } },
  { $project: { name: 1, interests: 1 } },
  { $unwind: '$interests' },
  { $group: { _id: '$interests', count: { $sum: 1 },
              users: { $topN: { n: usersLimit, sortBy: { name: 1, _id: 1 }, output: { _id: '$_id', name: '$name' } } } } },
  { $facet: {
      items: [ { $sort: { _id: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit },
               { $project: { _id: 0, interest: '$_id', count: 1, users: 1 } } ],
      total: [ { $count: 'count' } ] } },
]
```

`$gte: ''` matches users with at least one interest and uses the `interests` index. Each group only keeps the first `usersLimit` users (`$topN`) so a big group can't hit the 16 MB document limit. The full list of one group comes from `/grouped-by-interest/:interest/users`, which is a covered query on the compound index (0 docs read).

Interests are lowercased, trimmed and deduplicated on save, so `Chess` and `chess ` end up in the same group.

Note: on 1M users the full grouping was actually faster as a collection scan (0.97 s) than through the index (1.56 s), since it reads nearly every user anyway. The index is there for the per-interest query.

### 2. Posts of a user

```js
[
  { $match: { _id: userId } },
  { $project: { name: 1 } },
  { $lookup: { from: 'posts', localField: '_id', foreignField: 'author', as: 'posts',
               pipeline: [ { $sort: { _id: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit },
                           { $project: { author: 0 } } ] } },
  { $lookup: { from: 'posts', localField: '_id', foreignField: 'author', as: 'postCount',
               pipeline: [ { $count: 'count' } ] } },
]
```

Both lookups use `{ author: 1, _id: -1 }`: the first for one sorted page, the second for the total. Unknown user returns 404.

## Explain output

`pnpm explain` on the seeded data. No collection scans or in-memory sorts.

```
[ok] login: users.findOne({ email })
    index: email_1
    keysExamined=1 docsExamined=1
[ok] profile / auth: users.findById
    index: _id_
    keysExamined=1 docsExamined=1
[ok] admin list users, page 1
    index: _id_
    keysExamined=20 docsExamined=20
[ok] admin list users, page 3
    index: _id_
    keysExamined=60 docsExamined=20
[ok] user lists own notes, page 1
    index: owner_1__id_-1
    keysExamined=10 docsExamined=10
[ok] count own notes: countDocuments({ owner })
    index: owner_1__id_-1
    keysExamined=10 docsExamined=0
[ok] get note by id
    index: _id_
    keysExamined=1 docsExamined=1
[ok] update/delete own note: { _id, owner }
    index: _id_
    keysExamined=1 docsExamined=1
[ok] admin lists all notes, page 2
    index: _id_
    keysExamined=40 docsExamined=20
[ok] admin lists notes of one owner
    index: owner_1__id_-1
    keysExamined=10 docsExamined=10
[ok] posts feed, page 2
    index: _id_
    keysExamined=40 docsExamined=20
[ok] cascade delete: notes.deleteMany({ owner })
    index: owner_1__id_-1
    keysExamined=10 docsExamined=0
[ok] cascade delete: posts.deleteMany({ author })
    index: author_1__id_-1
    keysExamined=5 docsExamined=0
[ok] scenario 1: users grouped by interest, page 1
    index: interests_1_name_1__id_1
    keysExamined=153 docsExamined=76
[ok] scenario 1 drill-down: users with interest "chess", page 2
    index: interests_1_name_1__id_1
    keysExamined=18 docsExamined=0
[ok] scenario 1 drill-down: count users with "chess"
    index: interests_1_name_1__id_1
    keysExamined=18 docsExamined=0
[ok] scenario 2: posts of a user ($lookup page + $lookup count)
    index: _id_, author_1__id_-1 ($lookup)
    keysExamined=12 docsExamined=6
```

## Security

- bcrypt with cost 12, the hash is `select: false` and removed from JSON
- passwords capped at 72 chars (bcrypt ignores the rest)
- unknown emails still run a bcrypt compare, so login timing doesn't leak which emails exist
- JWT verify pinned to `HS256`, server won't start with a `JWT_SECRET` under 32 chars
- `/api/auth/*` rate limited to 50 requests per 15 min per IP
- zod strips unknown fields, so `role` can't be set through `PATCH /users/me`
- admins can't delete themselves or drop their own admin role
- no `dangerouslySetInnerHTML` in the frontend

## Layout

```
apps/api/
  src/models/          schemas and indexes
  src/aggregations.ts  aggregation 1 and 2
  src/routes/          auth, users, notes, posts, admin
  src/services/        user input schemas, create/update
  src/middleware/      auth, admin check, errors
  src/lib/             pagination, validation, jwt, password
  scripts/             seed, sync-indexes, explain
apps/web/              frontend
```
