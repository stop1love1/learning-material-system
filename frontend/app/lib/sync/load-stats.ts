'use client';
// Live loader: DB.ADMIN_STATS ← GET /stats/overview (admin/teacher; 401/403 swallowed).
// Replaces the hardcoded dashboard numbers (users/docs/trend/enrollTrend/342…).
import { DB } from '@/app/data/db';
import { statsApi } from '@/app/lib/api';

export async function loadStats(): Promise<void> {
  try {
    const o: any = await statsApi.overview();
    const s = DB.ADMIN_STATS;
    s.users = o.counts?.users ?? s.users;
    s.docs = o.counts?.files ?? s.docs;
    s.exercises = o.counts?.exercises ?? s.exercises;
    s.articles = o.counts?.articles ?? s.articles;
    s.questions = o.counts?.questions ?? 0;
    s.attempts = o.counts?.attempts ?? 0;
    s.submissions = o.counts?.submissions ?? 0;
    s.graded = o.grading?.graded ?? 0;
    s.ungraded = o.grading?.ungraded ?? 0;
    s.trends = o.trends ?? {};
    s.enrollTrend = Array.isArray(o.activity?.series) ? o.activity.series.map((x: any) => x.count) : s.enrollTrend;
    s.enrollDates = Array.isArray(o.activity?.series) ? o.activity.series.map((x: any) => x.date) : [];
    s.activityTotal = o.activity?.total ?? 0;
    s.activityTrend = o.activity?.trend ?? null;
    s.topFiles = Array.isArray(o.topFiles) ? o.topFiles : [];
    s.live = true; // screens use this to prefer real numbers over mock deltas
  } catch {
    return;
  }
}
