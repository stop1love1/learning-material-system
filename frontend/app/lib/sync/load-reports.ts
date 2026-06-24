'use client';
// Live loader: DB.ADMIN_REPORTS ← GET /stats/reports (admin/teacher; errors swallowed).
import { DB } from '@/app/data/db';
import { statsApi } from '@/app/lib/api';

export async function loadReports(): Promise<void> {
  try {
    const r: any = await statsApi.reports();
    DB.ADMIN_REPORTS = r;
  } catch {
    return;
  }
}
