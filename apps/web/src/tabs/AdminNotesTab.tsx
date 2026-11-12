import { PagedList, usePagedList } from '../PagedList';
import type { Note, User } from '../types';
import { NoteRow } from './NoteRow';

export function AdminNotesTab({ owner, onShowAll }: { owner: User | null; onShowAll: () => void }) {
  const list = usePagedList<Note>('/admin/notes', { owner: owner?._id });
  return (
    <section>
      <h2 data-testid="admin-notes-heading">{owner ? `Notes of ${owner.name}` : 'All notes'}</h2>
      {owner && (
        <button onClick={onShowAll} data-testid="admin-notes-all">
          Show all owners
        </button>
      )}
      <PagedList list={list} testId="admin-notes-list">
        {(note) => <NoteRow key={note._id} note={note} />}
      </PagedList>
    </section>
  );
}
