import { createApp } from './app.js';
import { ensureAdmin } from './bootstrap.js';
import { config } from './config.js';
import { connectDb } from './db.js';

await connectDb();
await ensureAdmin();
createApp().listen(config.port, () => console.log(`Listening on http://localhost:${config.port}`));
