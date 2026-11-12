import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';

type TokenPayload = { sub: string };

export function signToken(userId: string) {
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'], algorithm: 'HS256' };
  return jwt.sign({ sub: userId } satisfies TokenPayload, config.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
