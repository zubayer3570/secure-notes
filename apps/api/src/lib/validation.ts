import { isValidObjectId, Types } from 'mongoose';
import { z } from 'zod';
import { badRequest } from './http-error.js';

export const objectId = z
  .string()
  .refine((value) => isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value), 'Invalid id')
  .transform((value) => new Types.ObjectId(value));

export const idParams = z.object({ id: objectId });

export function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const message = result.error.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`).join('; ');
  throw badRequest(message);
}
