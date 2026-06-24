'use client';
// Loads DB.QUESTIONS from the backend question bank (scoped to the current user).
// GET /questions returns base rows only (no per-type detail), so we fetch each
// question's detail (GET /questions/:id) to fill options/answer/pairs, resolve
// topic ids → names via the topics map, and default the author to the current
// user (the list is JWT-scoped to them). Best-effort; falls back to mock on error.
import { DB } from '@/app/data/db';
import { authApi, questionsApi, topicsApi } from '@/app/lib/api';
import { formatRelativeVi } from '@/app/helpers/format-date';

export async function loadQuestions(): Promise<void> {
  try {
    const res = (await questionsApi.list({ pageSize: 200 })) as any;
    const records: any[] = res?.records ?? [];

    // Best-effort topic name map (id → title). Swallow failures.
    const topicMap: Record<string, string> = {};
    try {
      const topics = (await topicsApi.list()) as any[];
      (topics ?? []).forEach((tp: Record<string, any>) => { topicMap[String(tp._id)] = tp.title; });
    } catch { /* leave map empty → topics fall back to '' */ }

    // Questions are user-scoped (@CurrentUser on the backend list), so every
    // record belongs to the logged-in user — use their name as the author.
    let author = '—';
    try {
      const me = (await authApi.me()) as any;
      if (me?.name) author = me.name;
    } catch { /* keep '—' fallback */ }

    DB.QUESTIONS = await Promise.all(
      records.map(async (q: Record<string, any>) => {
        let options: string[] = [];
        let answer: any[] = [];
        let pairs: [string, string][] = [];
        try {
          const { detail } = (await questionsApi.get(q._id)) as any;
          if (detail) {
            if (q.type === 'single') {
              options = detail.options ?? [];
              answer = detail.correctOptionIndex != null ? [detail.correctOptionIndex] : [];
            } else if (q.type === 'multi') {
              options = detail.options ?? [];
              answer = detail.correctOptionIndices ?? [];
            } else if (q.type === 'truefalse') {
              answer = detail.isCorrect ? [0] : [1];
            } else if (q.type === 'fill') {
              answer = detail.answers ?? [];
            } else if (q.type === 'match') {
              pairs = (detail.pairs ?? []).map((pr: any) => [pr.left, pr.right] as [string, string]);
            }
          }
        } catch { /* leave defaults — never let an undefined field crash the preview */ }
        return {
          id: q._id,
          type: q.type,
          level: q.level,
          topic: (q.topicId && topicMap[String(q.topicId)]) ?? '',
          uses: q.uses ?? 0,
          updated: formatRelativeVi(q.updatedAt),
          author: q.userId?.name ?? author,
          stem: q.content,
          options,
          answer,
          pairs,
        };
      }),
    );
  } catch {
    return;
  }
}
