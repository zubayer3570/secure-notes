import type { Note } from '../types';
import { when } from '../utils';

type Props = { note: Note; onEdit?: () => void; onDelete?: () => void };

export function NoteRow({ note, onEdit, onDelete }: Props) {
  const owner = typeof note.owner === 'object' ? note.owner : null;
  return (
    <div className="row" data-testid="note-row" data-id={note._id}>
      <strong>{note.title}</strong>
      {owner && (
        <span className="muted">
          {' '}
          by {owner.name} &lt;{owner.email}&gt;
        </span>
      )}
      <div>{note.content}</div>
      <div className="muted">updated {when(note.updatedAt)}</div>
      {onEdit && (
        <button onClick={onEdit} data-testid="note-edit">
          Edit
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} data-testid="note-delete">
          Delete
        </button>
      )}
    </div>
  );
}
