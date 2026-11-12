import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../lib/http-error.js';
import { paginate, pageQuery } from '../lib/pagination.js';
import { idParams, parse } from '../lib/validation.js';
import { currentUser } from '../middleware/auth.js';
import { Note } from '../models/note.js';

export const notesRouter = Router();

const title = z.string().trim().min(1).max(200);
const content = z.string().max(20000);
const createNoteInput = z.object({ title, content: content.default('') });
const updateNoteInput = z.object({ title, content }).partial();

notesRouter.get('/', async (req, res) => {
  const filter = { owner: currentUser(req).id };
  const page = await paginate(
    parse(pageQuery, req.query),
    (skip, limit) => Note.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).lean(),
    () => Note.countDocuments(filter),
  );
  res.json(page);
});

notesRouter.post('/', async (req, res) => {
  const note = await Note.create({ ...parse(createNoteInput, req.body), owner: currentUser(req).id });
  res.status(201).json(note);
});

notesRouter.get('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  const me = currentUser(req);
  const note = await Note.findById(id).lean();
  if (!note || (me.role !== 'admin' && String(note.owner) !== me.id)) throw notFound('Note not found');
  res.json(note);
});

notesRouter.patch('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  const update = parse(updateNoteInput, req.body);
  const note = await Note.findOneAndUpdate({ _id: id, owner: currentUser(req).id }, update, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
  if (!note) throw notFound('Note not found');
  res.json(note);
});

notesRouter.delete('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  const { deletedCount } = await Note.deleteOne({ _id: id, owner: currentUser(req).id });
  if (!deletedCount) throw notFound('Note not found');
  res.status(204).end();
});
