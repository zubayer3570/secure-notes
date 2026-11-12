type Props = { page: number; totalPages: number; total: number; onPage: (page: number) => void; testId: string };

export function pageNumbers(page: number, totalPages: number) {
  const near = [1, page - 1, page, page + 1, totalPages].filter((n) => n >= 1 && n <= totalPages);
  const shown = [...new Set(near)].toSorted((a, b) => a - b);
  return shown.flatMap((n, index) => {
    const gap = index ? n - shown[index - 1] : 1;
    if (gap === 1) return [n];
    return gap === 2 ? [n - 1, n] : [null, n];
  });
}

export function Pager({ page, totalPages, total, onPage, testId }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="pager" data-testid={testId}>
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} data-testid={`${testId}-prev`}>
        Prev
      </button>
      {pageNumbers(page, totalPages).map((n, index) =>
        n === null ? (
          <span key={`gap-${index}`} className="muted">
            …
          </span>
        ) : (
          <button
            key={n}
            className={n === page ? 'active' : undefined}
            aria-current={n === page ? 'page' : undefined}
            disabled={n === page}
            onClick={() => onPage(n)}
            data-testid={`${testId}-page`}
            data-page={n}
          >
            {n}
          </button>
        ),
      )}
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} data-testid={`${testId}-next`}>
        Next
      </button>
      <span className="muted" data-testid={`${testId}-label`}>
        Page {page} of {totalPages} · {total} total
      </span>
    </div>
  );
}
