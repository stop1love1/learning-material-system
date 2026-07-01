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
    author: a.userId?.name ?? '—',
    date: formatDateVi(a.createdAt),
    read: (a.readMinutes ?? 4) + ' phút',
    views: a.viewCount ?? 0,
    cover: a.cover ?? 'clay',
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
