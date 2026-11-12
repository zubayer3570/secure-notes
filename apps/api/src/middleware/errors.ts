import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { HttpError } from '../lib/http-error.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found' });
};

const isDuplicateKey = (err: unknown) =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

const isBodyParseError = (err: unknown) =>
  typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
  if (isDuplicateKey(err)) return void res.status(409).json({ error: 'Email already in use' });
  if (isBodyParseError(err)) return void res.status(400).json({ error: 'Malformed JSON body' });
  if (err instanceof mongoose.Error.ValidationError) return void res.status(400).json({ error: err.message });
  if (err instanceof mongoose.Error.CastError) return void res.status(400).json({ error: 'Invalid id' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
