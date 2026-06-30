'use client';
// GET /questions is base rows only — each GET /questions/:id fills options/answer/pairs.
import { DB } from '@/app/store/store';
import { authApi, questionsApi, topicsApi } from '@/app/lib/api';
import { formatRelativeVi } from '@/app/helpers/format-date';

/**
 * Map one /questions BASE record into the list shape (no per-type detail fetch —
 * that removes the old N+1). The list only needs stem/type/level/topic/meta;
 * options/answer/pairs are filled lazily by the editor via questionsApi.get(id).
 * `topicNameOf` resolves the topic id → display name (the hook/loader pass the
 * topic map they fetched alongside the list).
 */
export function mapQuestion(
  q: Record<string, any>,
  topicNameOf?: (id: string) => string | undefined,
  author = '—',
): Record<string, any> {
  // The Question's Topic ref may arrive as `topic` or `topicId` (raw id or populated object).
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
    // List doesn't need these; the editor fetches detail lazily.
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

    DB.QUESTIONS = records.map((q) => mapQuestion(q, (id) => topicMap[id], author));
  } catch {
    DB.QUESTIONS = [];
  }
}
