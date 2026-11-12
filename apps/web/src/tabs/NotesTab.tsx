import { useState } from 'react';
import { api } from '../api';
import { PagedList, usePagedList } from '../PagedList';
import { useRun, useSubmit } from '../session';
import type { Note } from '../types';
import { formValues } from '../utils';
import { NoteRow } from './NoteRow';

export function NotesTab() {
  const run = useRun();
  const submit = useSubmit();
  const list = usePagedList<Note>('/notes');
  const [editing, setEditing] = useState<Note | null>(null);

  const save = submit(async (form) => {
    const data = formValues(form);
    if (editing) await api('PATCH', `/notes/${editing._id}`, data);
    else await api('POST', '/notes', data);
    form.reset();
    setEditing(null);
    await list.reload();
  });

  const remove = (note: Note) =>
    run(async () => {
      await api('DELETE', `/notes/${note._id}`);
      await list.reload();
    });

  return (
    <>
      <section>
        <h2>{editing ? 'Edit note' : 'New note'}</h2>
        <form key={editing?._id ?? 'new'} onSubmit={save} data-testid="note-form">
          <input name="title" placeholder="Title" required defaultValue={editing?.title} data-testid="note-title" />
          <textarea name="content" placeholder="Content" defaultValue={editing?.content} data-testid="note-content" />
          <button data-testid="note-save">Save</button>
          {editing && (
            <button type="button" onClick={() => setEditing(null)} data-testid="note-cancel">
              Cancel edit
            </button>
          )}
        </form>
      </section>
      <section>
        <h2>My notes</h2>
        <PagedList list={list} testId="notes-list">
          {(note) => (
            <NoteRow key={note._id} note={note} onEdit={() => setEditing(note)} onDelete={() => remove(note)} />
          )}
        </PagedList>
      </section>
    </>
  );
}
