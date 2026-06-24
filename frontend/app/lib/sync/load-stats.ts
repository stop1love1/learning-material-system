'use client';
import { DB } from '@/app/store/store';
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
    const s = DB.ADMIN_STATS;
    s.users = 0; s.docs = 0; s.exercises = 0; s.articles = 0; s.questions = 0;
    s.attempts = 0; s.submissions = 0; s.graded = 0; s.ungraded = 0;
    s.trends = {}; s.enrollTrend = []; s.enrollDates = [];
    s.activityTotal = 0; s.activityTrend = null; s.topFiles = []; s.live = false;
  }
}
