import { connectDb, disconnectDb } from '../src/db.js';
import { Note } from '../src/models/note.js';
import { Post } from '../src/models/post.js';
import { User } from '../src/models/user.js';

export async function syncIndexes() {
  for (const model of [User, Note, Post]) {
    const dropped = await model.syncIndexes();
    const indexes = await model.collection.indexes();
    console.log(`${model.collection.name}: ${indexes.map((index) => index.name).join(', ')}`);
    if (dropped.length) console.log(`  dropped: ${dropped.join(', ')}`);
  }
}

if (import.meta.main) {
  await connectDb();
  await syncIndexes();
  await disconnectDb();
}
