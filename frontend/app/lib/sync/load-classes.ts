'use client';

import { DB } from '@/app/store/store';
import { classesApi } from '@/app/lib/api';

// Fetch the teacher's/admin's classes (or the student's enrolled classes) and
// map them into DB.CLASSES. Best-effort: on error clear so the screen falls back
// to an empty list rather than stale data.
export async function loadClasses(): Promise<void> {
  try {
    const res: any = await classesApi.list({ pageSize: 200 });
    const records: any[] = (res as any)?.records ?? (Array.isArray(res) ? res : []);
    DB.CLASSES = records.map((c: Record<string, any>) => ({
      id: c._id || c.id,
      name: c.name,
      grade: c.grade ?? '',
      description: c.description ?? '',
      code: c.code ?? '',
      studentCount: c.studentCount ?? c.enrolledCount ?? 0,
    }));
  } catch {
    DB.CLASSES = [];
  }
}
