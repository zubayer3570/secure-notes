import { interestGroupsPipeline, userPostsPipeline } from '../src/aggregations.js';
import { connectDb, disconnectDb } from '../src/db.js';
import { skipFor, type PageQuery } from '../src/lib/pagination.js';
import { Note } from '../src/models/note.js';
import { Post } from '../src/models/post.js';
import { User } from '../src/models/user.js';

const LIMIT = 20;
const GROUP_USERS = 10;
const page = (n: number): PageQuery => ({ page: n, limit: LIMIT });
const mode = 'executionStats';

type Summary = {
  indexes: Set<string>;
  stages: Set<string>;
  keysExamined: number;
  docsExamined: number;
  collscan: boolean;
};

function walk(node: unknown, summary: Summary) {
  if (Array.isArray(node)) return node.forEach((child) => walk(child, summary));
  if (!node || typeof node !== 'object') return;
  const record = node as Record<string, unknown>;
  if (typeof record.stage === 'string') summary.stages.add(record.stage);
  if (record.stage === 'COLLSCAN') summary.collscan = true;
  if (typeof record.indexName === 'string') summary.indexes.add(record.indexName);
  if (Array.isArray(record.indexesUsed)) record.indexesUsed.forEach((name) => summary.indexes.add(`${name} ($lookup)`));
  if (typeof record.collectionScans === 'number' && record.collectionScans > 0) summary.collscan = true;
  if (typeof record.totalKeysExamined === 'number') summary.keysExamined += record.totalKeysExamined;
  if (typeof record.totalDocsExamined === 'number') summary.docsExamined += record.totalDocsExamined;
  Object.entries(record)
    .filter(([key]) => key !== 'rejectedPlans' && key !== 'allPlansExecution')
    .forEach(([, child]) => walk(child, summary));
}

async function report(label: string, explain: Promise<unknown>) {
  const summary: Summary = { indexes: new Set(), stages: new Set(), keysExamined: 0, docsExamined: 0, collscan: false };
  walk(await explain, summary);
  const indexes = summary.indexes.size ? [...summary.indexes].join(', ') : '(none)';
  const flags = [summary.collscan && 'COLLSCAN', summary.stages.has('SORT') && 'IN-MEMORY SORT'].filter(Boolean);
  console.log(
    `[${flags.join(', ') || 'ok'}] ${label}\n    index: ${indexes}\n    keysExamined=${summary.keysExamined} docsExamined=${summary.docsExamined}`,
  );
}

const explainCount = (collection: typeof User.collection, filter: Record<string, unknown>) =>
  collection.aggregate([{ $match: filter }, { $group: { _id: 1, n: { $sum: 1 } } }]).explain(mode);

type Pageable = {
  sort(order: Record<string, 1 | -1>): Pageable;
  skip(n: number): Pageable;
  limit(n: number): Pageable;
  explain(verbosity: typeof mode): Promise<unknown>;
};

const newestFirst = (find: Pageable, query: PageQuery) =>
  find.sort({ _id: -1 }).skip(skipFor(query)).limit(query.limit).explain(mode);

await connectDb();
const alice = await User.findOne({ email: 'alice@example.com' }).lean();
if (!alice) throw new Error('Run `pnpm seed` first');
const aliceNote = await Note.findOne({ owner: alice._id }).lean();
if (!aliceNote) throw new Error('Run `pnpm seed` first');
const interest = alice.interests[0];

await report('login: users.findOne({ email })', User.findOne({ email: alice.email }).explain(mode));
await report('profile / auth: users.findById', User.findById(alice._id).explain(mode));
await report('admin list users, page 1', newestFirst(User.find(), page(1)));
await report('admin list users, page 3', newestFirst(User.find(), page(3)));
await report('user lists own notes, page 1', newestFirst(Note.find({ owner: alice._id }), page(1)));
await report('count own notes: countDocuments({ owner })', explainCount(Note.collection, { owner: alice._id }));
await report('get note by id', Note.findById(aliceNote._id).explain(mode));
await report(
  'update/delete own note: { _id, owner }',
  Note.findOne({ _id: aliceNote._id, owner: alice._id }).explain(mode),
);
await report('admin lists all notes, page 2', newestFirst(Note.find(), page(2)));
await report('admin lists notes of one owner', newestFirst(Note.find({ owner: alice._id }), page(1)));
await report('posts feed, page 2', newestFirst(Post.find(), page(2)));
await report('cascade delete: notes.deleteMany({ owner })', Note.find({ owner: alice._id }, { _id: 1 }).explain(mode));
await report(
  'cascade delete: posts.deleteMany({ author })',
  Post.find({ author: alice._id }, { _id: 1 }).explain(mode),
);
await report(
  'scenario 1: users grouped by interest, page 1',
  User.aggregate(interestGroupsPipeline(page(1), GROUP_USERS)).explain(mode),
);
await report(
  `scenario 1 drill-down: users with interest "${interest}", page 2`,
  User.find({ interests: interest }, { name: 1 })
    .sort({ name: 1, _id: 1 })
    .skip(skipFor({ page: 2, limit: GROUP_USERS }))
    .limit(GROUP_USERS)
    .explain(mode),
);
await report(
  `scenario 1 drill-down: count users with "${interest}"`,
  explainCount(User.collection, { interests: interest }),
);
await report(
  'scenario 2: posts of a user ($lookup page + $lookup count)',
  User.aggregate(userPostsPipeline(alice._id, page(1))).explain(mode),
);
await disconnectDb();
