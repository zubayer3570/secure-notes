import { useState } from 'react';
import { useMe } from './session';
import { AdminNotesTab } from './tabs/AdminNotesTab';
import { AdminUsersTab } from './tabs/AdminUsersTab';
import { InterestsTab } from './tabs/InterestsTab';
import { NotesTab } from './tabs/NotesTab';
import { PostsTab } from './tabs/PostsTab';
import { ProfileTab } from './tabs/ProfileTab';
import type { User } from './types';

type TabId = 'notes' | 'posts' | 'interests' | 'profile' | 'admin-users' | 'admin-notes';
type View = { tab: TabId; owner: User | null; visit: number };
type Props = { onProfileSaved: (user: User) => void; onLogout: () => void };

const TABS: { id: TabId; label: string; admin?: boolean }[] = [
  { id: 'notes', label: 'My notes' },
  { id: 'posts', label: 'Posts' },
  { id: 'interests', label: 'Users by interest' },
  { id: 'profile', label: 'Profile' },
  { id: 'admin-users', label: 'Admin: users', admin: true },
  { id: 'admin-notes', label: 'Admin: all notes', admin: true },
];

export function Shell({ onProfileSaved, onLogout }: Props) {
  const me = useMe();
  const [view, setView] = useState<View>({ tab: 'notes', owner: null, visit: 0 });
  const open = (tab: TabId, owner: User | null = null) => setView((prev) => ({ tab, owner, visit: prev.visit + 1 }));
  const tabs = TABS.filter((tab) => !tab.admin || me.role === 'admin');

  return (
    <>
      <p>
        Signed in as{' '}
        <strong data-testid="whoami">
          {me.name} &lt;{me.email}&gt; ({me.role})
        </strong>{' '}
        <button onClick={onLogout} data-testid="logout">
          Logout
        </button>
      </p>
      <nav>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === view.tab ? 'active' : undefined}
            onClick={() => open(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <Panel key={view.visit} view={view} open={open} onProfileSaved={onProfileSaved} />
    </>
  );
}

type PanelProps = { view: View; open: (tab: TabId, owner?: User | null) => void; onProfileSaved: (user: User) => void };

function Panel({ view, open, onProfileSaved }: PanelProps) {
  if (view.tab === 'notes') return <NotesTab />;
  if (view.tab === 'posts') return <PostsTab />;
  if (view.tab === 'interests') return <InterestsTab />;
  if (view.tab === 'profile') return <ProfileTab onSaved={onProfileSaved} />;
  if (view.tab === 'admin-users') return <AdminUsersTab onViewNotes={(user) => open('admin-notes', user)} />;
  return <AdminNotesTab owner={view.owner} onShowAll={() => open('admin-notes')} />;
}
