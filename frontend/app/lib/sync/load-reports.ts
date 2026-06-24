'use client';
import { DB } from '@/app/store/store';
import { statsApi } from '@/app/lib/api';

export async function loadReports(): Promise<void> {
  try {
    const r: any = await statsApi.reports();
    DB.ADMIN_REPORTS = r;
  } catch {
    DB.ADMIN_REPORTS = null;
  }
}
