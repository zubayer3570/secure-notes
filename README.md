# Secure Notes

- Live site: https://secure-notes-deb5.onrender.com/
- Backend: https://secure-notes-deb5.onrender.com/api

## Admin accounts

Password for all: `Admin12345!`

- `admin@example.com`
- `admin2@example.com`
- `admin3@example.com`
- `admin4@example.com`
- `admin5@example.com`

## API routes

Everything except `/api` and `/api/auth/*` needs `Authorization: Bearer <token>`. Lists take `?page=1&limit=20`.

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api` | public |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET, PATCH | `/api/users/me` | any user |
| GET | `/api/users/grouped-by-interest` | any user |
| GET | `/api/users/grouped-by-interest/:interest/users` | any user |
| GET | `/api/users/:id/posts` | any user |
| GET, POST | `/api/notes` | any user |
| GET | `/api/notes/:id` | owner, admin |
| PATCH, DELETE | `/api/notes/:id` | owner |
| GET, POST | `/api/posts` | any user |
| DELETE | `/api/posts/:id` | author, admin |
| GET, POST | `/api/admin/users` | admin |
| GET, PATCH, DELETE | `/api/admin/users/:id` | admin |
| GET | `/api/admin/notes?owner=<id>` | admin |

## Frontend routes

Everything is served at `/` with no URL routes. It opens on login/register, then switches between these tabs:

| Tab | Access |
| --- | --- |
| My notes | any user |
| Posts | any user |
| Users by interest | any user |
| Profile | any user |
| Admin: users | admin |
| Admin: all notes | admin |
