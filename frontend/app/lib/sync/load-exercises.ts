'use client';
// Live loader: fills DB.ASSIGNMENTS and DB.STUDENT_TASKS from the exercises API.

import { DB } from '@/app/data/db';
import { exercisesApi } from '@/app/lib/api';
import { formatDateVi } from '@/app/helpers/format-date';

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

// Map backend ExerciseStatus (draft|open|closing|closed) to the values the
// teacher list (assign.tsx) understands (open|closing|done).
function statusVi(s: string): string {
  switch (s) {
    case 'closed':
      return 'done'; // backend "closed" → screen "done" (Đã đóng tab + ok tone)
    case 'draft':
      return 'open'; // screen has no draft concept; treat as open
    case 'open':
    case 'closing':
    default:
      return s ?? 'open';
  }
}

// Vietnamese relative due label from an ISO due date, matching the mock vocab.
function dueInVi(due: string | Date | null | undefined): string {
  if (!due) return '';
  const d = new Date(due);
  if (isNaN(d.getTime())) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'Đã đóng';
  if (diff === 0) return 'Hôm nay';
  return `Còn ${diff} ngày`;
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
      due: formatDateVi(e.dueDate),
      dueIn: dueInVi(e.dueDate),
      submitted: 0,
      total: 0,
      graded: 0,
      status: statusVi(e.status),
      points: e.points ?? 10,
      // questionCount is added by the backend list when available; 0 otherwise.
      questions: e.questionCount ?? 0,
    }));

    (DB as any).STUDENT_TASKS = records.map((e: Record<string, any>) => ({
      id: e._id,
      title: e.title,
      class: e.subject ?? '',
      type: typeVi(e.type),
      due: formatDateVi(e.dueDate),
      dueIn: dueInVi(e.dueDate),
      status: 'todo',
      points: e.points ?? 10,
      questions: e.questionCount ?? 0,
    }));
  } catch {
    return;
  }
}
