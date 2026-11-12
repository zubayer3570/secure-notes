import { PagedList, usePagedList } from '../PagedList';
import type { InterestGroup, UserRef } from '../types';

const USERS_PER_GROUP = 10;

export function InterestsTab() {
  const list = usePagedList<InterestGroup>('/users/grouped-by-interest', { usersLimit: String(USERS_PER_GROUP) });
  return (
    <section>
      <h2>Users grouped by interest</h2>
      <PagedList list={list} testId="interests-list">
        {(group) => <GroupRow key={group.interest} group={group} />}
      </PagedList>
    </section>
  );
}

function GroupRow({ group }: { group: InterestGroup }) {
  const users = usePagedList<UserRef>(
    `/users/grouped-by-interest/${encodeURIComponent(group.interest)}/users`,
    { limit: String(USERS_PER_GROUP) },
    {
      items: group.users,
      page: 1,
      limit: USERS_PER_GROUP,
      total: group.count,
      totalPages: Math.ceil(group.count / USERS_PER_GROUP),
    },
  );
  return (
    <div className="row" data-testid="interest-row" data-interest={group.interest}>
      <strong>{group.interest}</strong>
      <span className="muted"> ({group.count} users)</span>
      <PagedList list={users} testId="interest-users" empty="No users.">
        {(user) => (
          <span key={user._id} className="chip" data-testid="interest-user" data-id={user._id}>
            {user.name}
          </span>
        )}
      </PagedList>
    </div>
  );
}
