import { compare, hash } from 'bcryptjs';

const COST = 12;

export const hashPassword = (plain: string) => hash(plain, COST);

export const verifyPassword = (plain: string, passwordHash: string) => compare(plain, passwordHash);
