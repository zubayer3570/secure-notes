import { compare, hash } from 'bcryptjs';
import { z } from 'zod';

const COST = 12;
const BCRYPT_MAX_BYTES = 72;
export const MIN_PASSWORD_LENGTH = 10;

export const strongPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .regex(/\p{Ll}/u, 'must contain a lowercase letter')
  .regex(/\p{Lu}/u, 'must contain an uppercase letter')
  .regex(/\p{N}/u, 'must contain a number')
  .regex(/[^\p{L}\p{N}\s]/u, 'must contain a symbol')
  .refine((value) => Buffer.byteLength(value) <= BCRYPT_MAX_BYTES, `must be at most ${BCRYPT_MAX_BYTES} bytes`);

export const hashPassword = (plain: string) => hash(plain, COST);

export const verifyPassword = (plain: string, passwordHash: string) => compare(plain, passwordHash);
