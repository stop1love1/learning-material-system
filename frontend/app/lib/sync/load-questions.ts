'use client';
// GET /questions returns base rows only; per-type detail via GET /questions/:id.
import { DB } from '@/app/store/store';import { authApi, questionsApi, topicsApi } from '@/app/lib/api';
import { formatRelativeVi } from '@/app/helpers/format-date';

/** Map /questions base row → list shape (detail fetched lazily by editor). */
export function mapQuestion(  q: Record<string, any>,
  topicNameOf?: (id: string) => string | undefined,
  author = '—',
): Record<string, any> {
  const topicRef = q.topic ?? q.topicId;
  const topicId = topicRef ? String(topicRef?._id ?? topicRef) : '';
  const topicName =
    (topicRef && typeof topicRef === 'object' ? topicRef.title : undefined) ??
    (topicId && topicNameOf ? topicNameOf(topicId) : undefined) ??
    '';
  return {
    id: q._id,
    type: q.type,
    level: q.level,
    topicId,
    topic: topicName,
    uses: q.uses ?? 0,
    updated: formatRelativeVi(q.updatedAt),
    author: q.userId?.name ?? author,
    stem: q.content,
    options: [],
    answer: [],
    pairs: [],
  };
}

export async function loadQuestions(): Promise<void> {
  try {
    const res = (await questionsApi.list({ pageSize: 200 })) as any;
    const records: any[] = res?.records ?? [];

    const topicMap: Record<string, string> = {};
    try {
      const tres: any = await topicsApi.list();
      const topics: any[] = Array.isArray(tres) ? tres : (tres?.records ?? []);
      topics.forEach((tp: Record<string, any>) => { topicMap[String(tp._id)] = tp.title; });
      DB.TOPIC_TREE = topics.map((tp: Record<string, any>) => ({
        id: String(tp._id),
        name: tp.title,
        parentId: tp.parentId ? String(tp.parentId) : null,
      }));
    } catch { DB.TOPIC_TREE = []; }

    let author = '—';
    try {
      const me = (await authApi.me()) as any;
      if (me?.name) author = me.name;
    } catch { /* keep fallback */ }

    DB.QUESTIONS = records.map((q) => mapQuestion(q, (id) => topicMap[id], author));
  } catch {
    DB.QUESTIONS = [];
  }
}
