import { Router } from 'express';
import { badRequest, notFound } from '../lib/http-error.js';
import { paginate, pageQuery } from '../lib/pagination.js';
import { idParams, objectId, parse } from '../lib/validation.js';
import { currentUser } from '../middleware/auth.js';
import { Note } from '../models/note.js';
import { Post } from '../models/post.js';
import { User } from '../models/user.js';
import { adminCreateUserInput, adminUpdateUserInput, createUser, updateUser } from '../services/users.js';

export const adminRouter = Router();

adminRouter.get('/users', async (req, res) => {
  const page = await paginate(
    parse(pageQuery, req.query),
    (skip, limit) => User.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
    () => User.estimatedDocumentCount(),
  );
  res.json(page);
});

adminRouter.post('/users', async (req, res) => {
  res.status(201).json(await createUser(parse(adminCreateUserInput, req.body)));
});

adminRouter.get('/users/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  const user = await User.findById(id).lean();
  if (!user) throw notFound('User not found');
  res.json(user);
});

adminRouter.patch('/users/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  const input = parse(adminUpdateUserInput, req.body);
  if (String(id) === currentUser(req).id && input.role && input.role !== 'admin') {
    throw badRequest('Admins cannot remove their own admin role');
  }
  const user = await updateUser(id, input);
  if (!user) throw notFound('User not found');
  res.json(user);
});

adminRouter.delete('/users/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  if (String(id) === currentUser(req).id) throw badRequest('Admins cannot delete themselves');
  const { deletedCount } = await User.deleteOne({ _id: id });
  if (!deletedCount) throw notFound('User not found');
  await Promise.all([Note.deleteMany({ owner: id }), Post.deleteMany({ author: id })]);
  res.status(204).end();
});

const adminNotesQuery = pageQuery.extend({ owner: objectId.optional() });

adminRouter.get('/notes', async (req, res) => {
  const { owner, ...query } = parse(adminNotesQuery, req.query);
  const filter = owner ? { owner } : {};
  const page = await paginate(
    query,
    (skip, limit) => Note.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).populate('owner', 'name email').lean(),
    () => (owner ? Note.countDocuments(filter) : Note.estimatedDocumentCount()),
  );
  res.json(page);
});
