import { z } from 'zod';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const limitSchema = z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT);

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: limitSchema,
});

export type PageQuery = z.output<typeof pageQuery>;

export type Page<T> = { items: T[]; page: number; limit: number; total: number; totalPages: number };

export const skipFor = ({ page, limit }: PageQuery) => (page - 1) * limit;

export const toPage = <T>(items: T[], total: number, { page, limit }: PageQuery): Page<T> => ({
  items,
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export async function paginate<T>(
  query: PageQuery,
  findPage: (skip: number, limit: number) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<Page<T>> {
  const [items, total] = await Promise.all([findPage(skipFor(query), query.limit), count()]);
  return toPage(items, total, query);
}
