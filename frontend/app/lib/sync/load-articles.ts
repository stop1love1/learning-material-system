'use client';
// Live-data loader: fills DB.ARTICLES from the backend articles list endpoint.
import { DB } from '@/app/data/db';
import { articlesApi } from '@/app/lib/api';

export async function loadArticles(): Promise<void> {
  try {
    const res: any = await articlesApi.list({ pageSize: 100 });
    const records: any[] = res?.records ?? [];
    DB.ARTICLES = records.map((a: Record<string, any>) => ({
      id: a._id,
      title: a.title,
      excerpt: a.excerpt ?? '',
      cat: a.category ?? '',
      author: '—',
      date: a.createdAt ?? '',
      read: (a.readMinutes ?? 4) + ' phút',
      cover: a.cover ?? 'clay',
      body: a.content ? [a.content] : [],
    }));
  } catch {
    return;
  }
}
