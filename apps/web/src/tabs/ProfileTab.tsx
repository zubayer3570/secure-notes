import { api } from '../api';
import { useMe, useSubmit } from '../session';
import type { User } from '../types';
import { userPayload } from '../utils';

export function ProfileTab({ onSaved }: { onSaved: (user: User) => void }) {
  const me = useMe();
  const submit = useSubmit();
  const save = submit(async (form) => onSaved(await api<User>('PATCH', '/users/me', userPayload(form))));

  return (
    <section>
      <h2>Profile</h2>
      <form key={me.updatedAt} onSubmit={save} data-testid="profile-form">
        <label>
          Name <input name="name" required defaultValue={me.name} data-testid="profile-name" />
        </label>
        <label>
          Interests (comma separated){' '}
          <input name="interests" defaultValue={me.interests.join(', ')} data-testid="profile-interests" />
        </label>
        <label>
          New password (optional) <input name="password" type="password" minLength={8} data-testid="profile-password" />
        </label>
        <button data-testid="profile-save">Update</button>
      </form>
    </section>
  );
}
