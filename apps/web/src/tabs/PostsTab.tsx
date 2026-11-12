import { useState } from 'react';
import { api } from '../api';
import { PagedList, usePagedList } from '../PagedList';
import { useMe, useRun, useSubmit } from '../session';
import type { Page, Post, UserRef } from '../types';
import { formValues, when } from '../utils';

type PostsPage = Page<Post> & { author?: UserRef };

export function PostsTab() {
  const run = useRun();
  const submit = useSubmit();
  const [authorId, setAuthorId] = useState<string | null>(null);
  const list = usePagedList<Post, PostsPage>(authorId ? `/users/${authorId}/posts` : '/posts');
  const author = list.last?.author;

  const showAll = () => (authorId ? setAuthorId(null) : list.reload());

  const publish = submit(async (form) => {
    await api('POST', '/posts', formValues(form));
    form.reset();
    await showAll();
  });

  const remove = (post: Post) =>
    run(async () => {
      await api('DELETE', `/posts/${post._id}`);
      await list.reload();
    });

  return (
    <>
      <section>
        <h2>New post</h2>
        <form onSubmit={publish} data-testid="post-form">
          <input name="title" placeholder="Title" required data-testid="post-title" />
          <textarea name="body" placeholder="Body" required data-testid="post-body" />
          <button data-testid="post-publish">Publish</button>
        </form>
      </section>
      <section>
        <h2 data-testid="posts-heading">{author ? `Posts by ${author.name}` : 'All posts'}</h2>
        {authorId && (
          <button onClick={showAll} data-testid="posts-all">
            Back to all posts
          </button>
        )}
        <PagedList list={list} testId="posts-list" empty={authorId ? 'No posts.' : undefined}>
          {(post) => (
            <PostRow
              key={post._id}
              post={post}
              author={author ?? post.author}
              onAuthor={setAuthorId}
              onDelete={() => remove(post)}
            />
          )}
        </PagedList>
      </section>
    </>
  );
}

type RowProps = { post: Post; author?: UserRef | null; onAuthor: (id: string) => void; onDelete: () => void };

function PostRow({ post, author, onAuthor, onDelete }: RowProps) {
  const me = useMe();
  const canDelete = me.role === 'admin' || author?._id === me._id;
  return (
    <div className="row" data-testid="post-row" data-id={post._id}>
      <strong>{post.title}</strong>
      {author && (
        <span>
          {' '}
          by{' '}
          <button type="button" className="link" onClick={() => onAuthor(author._id)} data-testid="post-author">
            {author.name}
          </button>
        </span>
      )}
      <div>{post.body}</div>
      <div className="muted">{when(post.createdAt)}</div>
      {canDelete && (
        <button onClick={onDelete} data-testid="post-delete">
          Delete
        </button>
      )}
    </div>
  );
}
