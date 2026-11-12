import { Types } from 'mongoose';
import { z } from 'zod';
import { hashPassword } from '../lib/password.js';
import { ROLES, User } from '../models/user.js';

const name = z.string().trim().min(1).max(100);
const email = z.email().trim().toLowerCase().max(254);
const password = z.string().min(8).max(72);
const interests = z.array(z.string().trim().min(1).max(50)).max(50);
const role = z.enum(ROLES);

export const registerInput = z.object({ name, email, password, interests: interests.optional() });
export const loginInput = z.object({ email, password: z.string().min(1).max(72) });
export const updateSelfInput = z.object({ name, interests, password }).partial();
export const adminCreateUserInput = registerInput.extend({ role: role.default('user') });
export const adminUpdateUserInput = z.object({ name, email, password, interests, role }).partial();

type CreateUser = z.output<typeof adminCreateUserInput>;
type UpdateUser = z.output<typeof adminUpdateUserInput>;

export async function createUser({ password: plainPassword, ...fields }: CreateUser) {
  const user = await User.create({ ...fields, passwordHash: await hashPassword(plainPassword) });
  return user.toJSON();
}

export async function updateUser(id: Types.ObjectId | string, { password: plainPassword, ...fields }: UpdateUser) {
  const update = plainPassword ? { ...fields, passwordHash: await hashPassword(plainPassword) } : fields;
  return User.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).lean();
}
