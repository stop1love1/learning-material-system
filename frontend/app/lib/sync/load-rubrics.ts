'use client';
// GET /rubrics embeds levels + criterions per row — no per-id detail fetch (no N+1).
import { DB } from '@/app/store/store';
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
          criterionId: c._id,
          name: c.name,
          weight: c.weight ?? 0,
          desc: c.note ?? c.desc ?? '',
        })),
        scale: levels.map((l: Record<string, any>) => ({
          levelId: l._id,
          label: l.name,
          pct: l.percentage ?? 0,
        })),
      };
    });
  } catch {
    DB.RUBRICS = [];
  }
}
