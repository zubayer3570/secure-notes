import { Router } from 'express';
import { z } from 'zod';
import { postsOfUser, usersGroupedByInterest } from '../aggregations.js';
import { notFound } from '../lib/http-error.js';
import { paginate, pageQuery } from '../lib/pagination.js';
import { idParams, parse } from '../lib/validation.js';
import { currentUser } from '../middleware/auth.js';
import { User } from '../models/user.js';
import { updateSelfInput, updateUser } from '../services/users.js';

export const usersRouter = Router();

const interestGroupsQuery = pageQuery.extend({ usersLimit: z.coerce.number().int().min(1).max(50).default(10) });
const interestParams = z.object({ interest: z.string().trim().toLowerCase().min(1).max(50) });

usersRouter.get('/me', async (req, res) => {
  const user = await User.findById(currentUser(req).id).lean();
  if (!user) throw notFound('User not found');
  res.json(user);
});

usersRouter.patch('/me', async (req, res) => {
  const user = await updateUser(currentUser(req).id, parse(updateSelfInput, req.body));
  if (!user) throw notFound('User not found');
  res.json(user);
});

usersRouter.get('/grouped-by-interest', async (req, res) => {
  const { usersLimit, ...query } = parse(interestGroupsQuery, req.query);
  res.json(await usersGroupedByInterest(query, usersLimit));
});

usersRouter.get('/grouped-by-interest/:interest/users', async (req, res) => {
  const { interest } = parse(interestParams, req.params);
  const filter = { interests: interest };
  const page = await paginate(
    parse(pageQuery, req.query),
    (skip, limit) => User.find(filter, { name: 1 }).sort({ name: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    () => User.countDocuments(filter),
  );
  res.json({ interest, ...page });
});

usersRouter.get('/:id/posts', async (req, res) => {
  const { id } = parse(idParams, req.params);
  const result = await postsOfUser(id, parse(pageQuery, req.query));
  if (!result) throw notFound('User not found');
  res.json(result);
});
