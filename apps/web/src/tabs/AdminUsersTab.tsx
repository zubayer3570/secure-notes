import { useState } from 'react';
import { api } from '../api';
import { PagedList, usePagedList } from '../PagedList';
import { useMe, useRun, useSubmit } from '../session';
import type { User } from '../types';
import { userPayload } from '../utils';

export function AdminUsersTab({ onViewNotes }: { onViewNotes: (user: User) => void }) {
  const me = useMe();
  const run = useRun();
  const submit = useSubmit();
  const list = usePagedList<User>('/admin/users');
  const [editing, setEditing] = useState<User | null>(null);

  const save = submit(async (form) => {
    const body = userPayload(form);
    if (editing) await api('PATCH', `/admin/users/${editing._id}`, body);
    else await api('POST', '/admin/users', body);
    form.reset();
    setEditing(null);
    await list.reload();
  });

  const remove = (user: User) =>
    run(async () => {
      await api('DELETE', `/admin/users/${user._id}`);
      await list.reload();
    });

  return (
    <>
      <section>
        <h2>{editing ? `Edit ${editing.email}` : 'Create user'}</h2>
        <form key={editing?._id ?? 'new'} onSubmit={save} data-testid="user-form">
          <input name="name" placeholder="Name" required defaultValue={editing?.name} data-testid="user-name" />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            defaultValue={editing?.email}
            data-testid="user-email"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (required on create)"
            minLength={8}
            data-testid="user-password"
          />
          <input
            name="interests"
            placeholder="Interests, comma separated"
            defaultValue={editing?.interests.join(', ')}
            data-testid="user-interests"
          />
          <select name="role" defaultValue={editing?.role ?? 'user'} data-testid="user-role">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button data-testid="user-save">Save</button>
          {editing && (
            <button type="button" onClick={() => setEditing(null)} data-testid="user-cancel">
              Cancel edit
            </button>
          )}
        </form>
      </section>
      <section>
        <h2>Users</h2>
        <PagedList list={list} testId="users-list">
          {(user) => (
            <div key={user._id} className="row" data-testid="user-row" data-id={user._id}>
              <strong>{user.name}</strong>
              <span> &lt;{user.email}&gt; </span>
              <span className="muted">
                {user.role} | interests: {user.interests.join(', ') || '-'}
              </span>
              <div>
                <button onClick={() => setEditing(user)} data-testid="user-edit">
                  Edit
                </button>
                <button onClick={() => onViewNotes(user)} data-testid="user-notes">
                  Notes
                </button>
                {user._id !== me._id && (
                  <button onClick={() => remove(user)} data-testid="user-delete">
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </PagedList>
      </section>
    </>
  );
}
