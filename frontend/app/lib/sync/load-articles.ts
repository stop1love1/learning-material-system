'use client';
import { DB } from '@/app/store/store';
import { articlesApi } from '@/app/lib/api';
import { formatDateVi } from '@/app/helpers/format-date';

/** Map /articles record → screen shape (shared by loader + hook). */
export function mapArticle(a: Record<string, any>): Record<string, any> {
  return {
    id: a._id,
    title: a.title,
    excerpt: a.excerpt ?? '',
    cat: a.category ?? '',
    tags: Array.isArray(a.tags) ? a.tags : [],
    author: a.userId?.name ?? '—',
    date: formatDateVi(a.createdAt),
    read: (a.readMinutes ?? 4) + ' phút',
    views: a.viewCount ?? 0,
    cover: a.cover ?? 'clay',
    image: (Array.isArray(a.images) && a.images[0]) || '',
    body: a.content ? [a.content] : [],
    html: a.content ?? '',
  };
}

export async function loadArticles(): Promise<void> {
  try {
    const res: any = await articlesApi.list({ pageSize: 100 });
    const records: any[] = res?.records ?? [];
    DB.ARTICLES = records.map(mapArticle);
  } catch {
    DB.ARTICLES = [];
  }
}

/**
 * Fetch a single article by id (GET /articles/:id — also $inc's viewCount) and
 * upsert it into DB.ARTICLES by id. Ensures the detail view shows the correct
 * article even when it isn't in the first-100 list. Best-effort: leaves DB
 * untouched on error.
 */
export async function loadArticle(id: string): Promise<void> {
  if (!id) return;
  try {
    const rec: any = await articlesApi.get(id);
    if (!rec?._id) return;
    const mapped = mapArticle(rec);
    const i = DB.ARTICLES.findIndex((x: any) => x.id === mapped.id);
    if (i >= 0) DB.ARTICLES[i] = mapped;
    else DB.ARTICLES = [...DB.ARTICLES, mapped];
  } catch {
    /* best-effort */
  }
}
