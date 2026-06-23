'use client';
// Loads DB.RUBRICS from the backend rubric module (scoped to the current user).
// GET /rubrics returns a pagination envelope { records } whose rubrics do NOT embed
// levels/criterions, so we fetch the detail (GET /rubrics/:id) for the first ~30 to
// populate criteria + scale. Beyond that cap, criteria/scale stay empty.
import { DB } from '@/app/data/db';
import { rubricsApi } from '@/app/lib/api';

export async function loadRubrics(): Promise<void> {
  try {
    const res = (await rubricsApi.list({ pageSize: 200 })) as any;
    const records: any[] = res?.records ?? [];

    const DETAIL_CAP = 30;
    const detailed = await Promise.all(
      records.map(async (r: Record<string, any>, i: number) => {
        if (i >= DETAIL_CAP) return r;
        try {
          return (await rubricsApi.get(r._id as string)) as any;
        } catch {
          return r;
        }
      }),
    );

    DB.RUBRICS = detailed.map((r: Record<string, any>) => {
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
