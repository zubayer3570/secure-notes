import type { Request, RequestHandler } from 'express';
import { isValidObjectId } from 'mongoose';
import { forbidden, unauthorized } from '../lib/http-error.js';
import { verifyToken } from '../lib/jwt.js';
import { User, type Role } from '../models/user.js';

export type AuthUser = { id: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

const bearerToken = (req: Request) => {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = bearerToken(req);
  if (!token) throw unauthorized();
  const payload = verifyToken(token);
  if (!payload || !isValidObjectId(payload.sub)) throw unauthorized('Invalid or expired token');
  const user = await User.findById(payload.sub, { role: 1 }).lean();
  if (!user) throw unauthorized('Invalid or expired token');
  req.auth = { id: String(user._id), role: user.role };
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.auth?.role !== 'admin') throw forbidden();
  next();
};

export function currentUser(req: Request): AuthUser {
  if (!req.auth) throw unauthorized();
  return req.auth;
}
