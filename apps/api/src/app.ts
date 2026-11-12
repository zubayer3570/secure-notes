import express, { type Express } from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { authenticate, requireAdmin } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { notesRouter } from './routes/notes.js';
import { postsRouter } from './routes/posts.js';
import { usersRouter } from './routes/users.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '100kb' }));

  app.get('/api', (_req, res) => res.json({ name: 'secure-notes-api', status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/users', authenticate, usersRouter);
  app.use('/api/notes', authenticate, notesRouter);
  app.use('/api/posts', authenticate, postsRouter);
  app.use('/api/admin', authenticate, requireAdmin, adminRouter);

  app.use('/api', notFoundHandler);
  serveWeb(app);
  app.use(errorHandler);
  return app;
}

function serveWeb(app: Express) {
  const webDist = resolve(process.cwd(), '../web/dist');
  if (!existsSync(webDist)) return;
  app.use(express.static(webDist));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve(webDist, 'index.html')));
}
