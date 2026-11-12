import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../lib/http-error.js';
import { paginate, pageQuery } from '../lib/pagination.js';
import { idParams, parse } from '../lib/validation.js';
import { currentUser } from '../middleware/auth.js';
import { Post } from '../models/post.js';

export const postsRouter = Router();

const createPostInput = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20000),
});

postsRouter.get('/', async (req, res) => {
  const page = await paginate(
    parse(pageQuery, req.query),
    (skip, limit) => Post.find().sort({ _id: -1 }).skip(skip).limit(limit).populate('author', 'name').lean(),
    () => Post.estimatedDocumentCount(),
  );
  res.json(page);
});

postsRouter.post('/', async (req, res) => {
  const post = await Post.create({ ...parse(createPostInput, req.body), author: currentUser(req).id });
  res.status(201).json(post);
});

postsRouter.delete('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  const me = currentUser(req);
  const filter = me.role === 'admin' ? { _id: id } : { _id: id, author: me.id };
  const { deletedCount } = await Post.deleteOne(filter);
  if (!deletedCount) throw notFound('Post not found');
  res.status(204).end();
});
