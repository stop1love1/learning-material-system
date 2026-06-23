'use client';
// Loads DB.QUESTIONS from the backend question bank (scoped to the current user).
import { DB } from '@/app/data/db';
import { questionsApi } from '@/app/lib/api';

export async function loadQuestions(): Promise<void> {
  try {
    const res = (await questionsApi.list({ pageSize: 200 })) as any;
    const records: any[] = res?.records ?? [];
    DB.QUESTIONS = records.map((q: Record<string, any>) => ({
      id: q._id,
      type: q.type,
      level: q.level,
      topic: q.topicId ?? '',
      uses: q.uses ?? 0,
      updated: q.updatedAt ?? '',
      author: '—',
      stem: q.content,
      options: [],
      answer: [],
    }));
  } catch {
    return;
  }
}
