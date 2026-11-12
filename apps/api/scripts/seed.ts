import { Types } from 'mongoose';
import { ensureAdmin } from '../src/bootstrap.js';
import { config } from '../src/config.js';
import { connectDb, disconnectDb } from '../src/db.js';
import { hashPassword } from '../src/lib/password.js';
import { Note } from '../src/models/note.js';
import { Post } from '../src/models/post.js';
import { User } from '../src/models/user.js';
import { syncIndexes } from './sync-indexes.js';

const TOTAL_USERS = 100;
const TOTAL_ADMINS = 5;
const TOTAL_POSTS = 50;
const NOTES_PER_USER = 10;
const POSTS_PER_DEMO_USER = 5;
const DEMO_PASSWORD = 'Password123!';
const ADMIN_PASSWORD = config.admin?.password ?? DEMO_PASSWORD;
const INTERESTS = [
  'chess',
  'reading',
  'hiking',
  'cooking',
  'music',
  'gaming',
  'travel',
  'photography',
  'cycling',
  'painting',
  'coding',
  'yoga',
];

const pick = <T>(items: T[], count: number) => items.toSorted(() => Math.random() - 0.5).slice(0, count);

await connectDb();
await Promise.all([User.deleteMany({}), Note.deleteMany({}), Post.deleteMany({})]);
await syncIndexes();
await ensureAdmin();
const existingUsers = await User.countDocuments();

const [userHash, adminHash] = await Promise.all([hashPassword(DEMO_PASSWORD), hashPassword(ADMIN_PASSWORD)]);
const extraAdmins = Array.from({ length: TOTAL_ADMINS - existingUsers }, (_, i) => ({
  name: `Admin ${i + 2}`,
  email: `admin${i + 2}@example.com`,
  interests: pick(INTERESTS, 2),
  role: 'admin',
  passwordHash: adminHash,
}));
const demoUsers = [
  { name: 'Alice', email: 'alice@example.com', interests: ['chess', 'reading'] },
  { name: 'Bob', email: 'bob@example.com', interests: ['reading', 'hiking', 'cooking'] },
  { name: 'Carol', email: 'carol@example.com', interests: ['chess', 'music'] },
];
const bulkCount = TOTAL_USERS - existingUsers - extraAdmins.length - demoUsers.length;
const bulkUsers = Array.from({ length: bulkCount }, (_, i) => ({
  name: `User ${String(i).padStart(3, '0')}`,
  email: `user${i}@example.com`,
  interests: pick(INTERESTS, i % 4),
}));
const regularUsers = [...demoUsers, ...bulkUsers].map((user) => ({ ...user, role: 'user', passwordHash: userHash }));

const admins = await User.insertMany(extraAdmins);
const users = await User.insertMany(regularUsers);

const notes = [...admins, ...users].flatMap((user) =>
  Array.from({ length: NOTES_PER_USER }, (_, n) => ({
    owner: user._id,
    title: `Note ${n + 1}`,
    content: `Private note ${n + 1}`,
  })),
);
await Note.insertMany(notes);

const demoAuthors = users
  .slice(0, demoUsers.length)
  .flatMap((user) => Array<Types.ObjectId>(POSTS_PER_DEMO_USER).fill(user._id));
const authors = [...demoAuthors, ...users.slice(demoUsers.length).map((user) => user._id)].slice(0, TOTAL_POSTS);
await Post.insertMany(authors.map((author, i) => ({ author, title: `Post ${i + 1}`, body: `Public post ${i + 1}` })));

const [userCount, adminCount, postCount, noteCount] = await Promise.all([
  User.countDocuments(),
  User.countDocuments({ role: 'admin' }),
  Post.countDocuments(),
  Note.countDocuments(),
]);
console.log(`Seeded ${userCount} users (${adminCount} admins), ${postCount} posts, ${noteCount} notes.`);
console.log(
  `Admins: ${config.admin?.email ?? ''} ${extraAdmins.map((admin) => admin.email).join(', ')} / ${ADMIN_PASSWORD}`,
);
console.log(
  `Users: ${demoUsers.map((user) => user.email).join(', ')}, user0..user${bulkCount - 1}@example.com / ${DEMO_PASSWORD}`,
);
await disconnectDb();
