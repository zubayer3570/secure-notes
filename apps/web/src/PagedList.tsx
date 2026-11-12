import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, withQuery, type Query } from './api';
import { Pager } from './Pager';
import { useRun } from './session';
import type { Page } from './types';

export type PagedListState<T> = {
  items: T[];
  loaded: boolean;
  page: number;
  totalPages: number;
  total: number;
  setPage: (page: number) => void;
};

export function usePagedList<T, P extends Page<T> = Page<T>>(path: string, params: Query = {}, firstPage?: P) {
  const run = useRun();
  const key = withQuery(path, params);
  const [target, setTarget] = useState({ key, page: 1 });
  const [fetched, setFetched] = useState<{ key: string; data: P } | null>(null);
  const request = useRef(0);
  if (target.key !== key) setTarget({ key, page: 1 });
  const page = target.key === key ? target.page : 1;
  const seeded = firstPage !== undefined && page === 1;
  const last = seeded ? firstPage : fetched?.key === key ? fetched.data : null;
  const setPage = useCallback((next: number) => setTarget({ key, page: next }), [key]);

  const reload = useCallback(
    () =>
      run(async () => {
        const id = ++request.current;
        if (seeded) return;
        const data = await api<P>('GET', withQuery(key, { page: String(page) }));
        if (id !== request.current) return;
        if (!data.items.length && page > 1) return setPage(Math.min(page - 1, data.totalPages));
        setFetched({ key, data });
      }),
    [run, key, page, seeded, setPage],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    items: last?.items ?? [],
    last,
    loaded: last !== null,
    page,
    totalPages: last?.totalPages ?? 1,
    total: last?.total ?? 0,
    setPage,
    reload,
  };
}

type Props<T> = { list: PagedListState<T>; testId: string; empty?: string; children: (item: T) => ReactNode };

export function PagedList<T>({ list, testId, empty = 'Nothing here yet.', children }: Props<T>) {
  return (
    <div data-testid={testId}>
      {list.loaded && !list.items.length && <p className="muted">{empty}</p>}
      {list.items.map(children)}
      <Pager
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        onPage={list.setPage}
        testId={`${testId}-pager`}
      />
    </div>
  );
}
