import { config } from './config.js';
import { hashPassword } from './lib/password.js';
import { User } from './models/user.js';

export async function ensureAdmin() {
  if (!config.admin) return;
  const email = config.admin.email.toLowerCase();
  const passwordHash = await hashPassword(config.admin.password);
  await User.updateOne(
    { email },
    { $setOnInsert: { email, name: 'Admin', role: 'admin', passwordHash, interests: [] } },
    { upsert: true },
  );
}
