'use client';
// Loads DB.RUBRICS from the backend rubric module (scoped to the current user).
// GET /rubrics now embeds levels + criterions per row (server-side aggregation),
// so we map the list payload directly — no per-id detail fetch (no N+1).
import { DB } from '@/app/data/db';
import { rubricsApi } from '@/app/lib/api';

export async function loadRubrics(): Promise<void> {
  try {
    const res = (await rubricsApi.list({ pageSize: 200 })) as any;
    const records: any[] = res?.records ?? [];

    DB.RUBRICS = records.map((r: Record<string, any>) => {
      const levels: any[] = r.levels ?? [];
      const criterions: any[] = r.criterions ?? r.criteria ?? [];
      return {
        id: r._id,
        name: r.name,
        used: r.usedCount ?? 0,
        levels: levels.length,
        criteria: criterions.map((c: Record<string, any>) => ({
          name: c.name,
          weight: c.weight ?? 0,
          desc: c.note ?? c.desc ?? '',
        })),
        scale: levels.map((l: Record<string, any>) => ({
          label: l.name,
          pct: l.percentage ?? 0,
        })),
      };
    });
  } catch {
    return;
  }
}
