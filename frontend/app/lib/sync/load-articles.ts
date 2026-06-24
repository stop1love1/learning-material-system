'use client';
// Live-data loader: fills DB.ARTICLES from the backend articles list endpoint.
import { DB } from '@/app/data/db';
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
      cover: a.cover ?? 'clay',
      body: a.content ? [a.content] : [],
      html: a.content ?? '', // content is stored as HTML; rendered via dangerouslySetInnerHTML.
    }));
  } catch {
    return;
  }
}
