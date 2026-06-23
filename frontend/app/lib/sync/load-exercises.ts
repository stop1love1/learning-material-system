'use client';
// Live loader: fills DB.ASSIGNMENTS and DB.STUDENT_TASKS from the exercises API.

import { DB } from '@/app/data/db';
import { exercisesApi } from '@/app/lib/api';

function typeVi(t: string): string {
  switch (t) {
    case 'quiz':
      return 'Trắc nghiệm';
    case 'essay':
      return 'Tự luận';
    case 'file':
      return 'Nộp tệp';
    default:
      return t ?? '';
  }
}

export async function loadExercises(): Promise<void> {
  try {
    const res: any = await exercisesApi.list({ pageSize: 200 });
    const records: any[] = (res as any)?.records ?? [];

    (DB as any).ASSIGNMENTS = records.map((e: Record<string, any>) => ({
      id: e._id,
      title: e.title,
      class: e.subject ?? '',
      type: typeVi(e.type),
      due: e.dueDate ?? '',
      dueIn: '',
      submitted: 0,
      total: 0,
      graded: 0,
      status: e.status,
      points: e.points ?? 10,
      questions: 0,
    }));

    (DB as any).STUDENT_TASKS = records.map((e: Record<string, any>) => ({
      id: e._id,
      title: e.title,
      class: e.subject ?? '',
      type: typeVi(e.type),
      due: e.dueDate ?? '',
      dueIn: '',
      status: 'todo',
      points: e.points ?? 10,
      questions: 0,
    }));
  } catch {
    return;
  }
}
