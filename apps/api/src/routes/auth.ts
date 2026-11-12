import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { unauthorized } from '../lib/http-error.js';
import { signToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { parse } from '../lib/validation.js';
import { User } from '../models/user.js';
import { createUser, loginInput, registerInput } from '../services/users.js';

export const authRouter = Router();

authRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false }));

const dummyHash = hashPassword('timing-equalizer');

authRouter.post('/register', async (req, res) => {
  const input = parse(registerInput, req.body);
  const user = await createUser({ ...input, role: 'user' });
  res.status(201).json({ token: signToken(String(user._id)), user });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = parse(loginInput, req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid) throw unauthorized('Invalid email or password');
  res.json({ token: signToken(String(user._id)), user: user.toJSON() });
});
