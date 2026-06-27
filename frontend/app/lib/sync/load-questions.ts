'use client';
// GET /questions is base rows only — each GET /questions/:id fills options/answer/pairs.
import { DB } from '@/app/store/store';
import { authApi, questionsApi, topicsApi } from '@/app/lib/api';
import { formatRelativeVi } from '@/app/helpers/format-date';

export async function loadQuestions(): Promise<void> {
  try {
    const res = (await questionsApi.list({ pageSize: 200 })) as any;
    const records: any[] = res?.records ?? [];

    const topicMap: Record<string, string> = {};
    try {
      const topics = (await topicsApi.list()) as any[];
      (topics ?? []).forEach((tp: Record<string, any>) => { topicMap[String(tp._id)] = tp.title; });
      // Flat tree for the FolderTree sidebar (label field is `name`).
      DB.TOPIC_TREE = (topics ?? []).map((tp: Record<string, any>) => ({
        id: String(tp._id),
        name: tp.title,
        parentId: tp.parentId ? String(tp.parentId) : null,
      }));
    } catch { DB.TOPIC_TREE = []; /* leave map empty → topics fall back to '' */ }

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
        // The Question's Topic ref may arrive as `topic` or `topicId` (raw id or populated object).
        const topicRef = q.topic ?? q.topicId;
        const topicId = topicRef ? String(topicRef?._id ?? topicRef) : '';
        return {
          id: q._id,
          type: q.type,
          level: q.level,
          topicId,
          topic: (topicId && topicMap[topicId]) ?? '',
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
    DB.QUESTIONS = [];
  }
}
