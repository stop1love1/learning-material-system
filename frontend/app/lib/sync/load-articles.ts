'use client';
import { DB } from '@/app/store/store';
import { articlesApi } from '@/app/lib/api';
import { formatDateVi } from '@/app/helpers/format-date';

export async function loadArticles(): Promise<void> {
  try {
    const res: any = await articlesApi.list({ pageSize: 100 });
    const records: any[] = res?.records ?? [];
    DB.ARTICLES = records.map((a: Record<string, any>) => ({
      id: a._id,
      title: a.title,
      excerpt: a.excerpt ?? '',
      cat: a.category ?? '',
      // userId is a raw ObjectId today; if the backend populates it to { name },
      // we read the name. Falls back to '—' otherwise.
      author: a.userId?.name ?? '—',
      date: formatDateVi(a.createdAt),
      read: (a.readMinutes ?? 4) + ' phút',
      views: a.viewCount ?? 0,
      cover: a.cover ?? 'clay',
      body: a.content ? [a.content] : [],
      html: a.content ?? '',
    }));
  } catch {
    DB.ARTICLES = [];
  }
}
