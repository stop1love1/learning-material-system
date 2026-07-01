'use client';
import { DB } from '@/app/store/store';
import { exercisesApi, attemptsApi, exerciseFoldersApi } from '@/app/lib/api';
import { formatDateVi } from '@/app/helpers/format-date';

export function typeVi(t: string): string {
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

/** Backend status (draft|open|closing|closed) → screen values (open|closing|done). */
export function statusVi(s: string): string {
  switch (s) {
    case 'closed':
      return 'done';
    case 'draft':
      return 'open';
    case 'open':
    case 'closing':
    default:
      return s ?? 'open';
  }
}

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

/** Map /exercises record → assignment shape (shared by loader + paged hook). */
export function mapExercise(e: Record<string, any>): Record<string, any> {
  const submitted = e.submittedCount ?? 0;
  return {
    id: e._id,
    title: e.title,
    folderId: e.folderId ? String(e.folderId?._id ?? e.folderId) : null,
    subject: e.subject ?? '',
    rawType: e.type,
    rawStatus: e.status,
    type: typeVi(e.type),
    due: formatDateVi(e.dueDate),
    dueIn: dueInVi(e.dueDate),
    submitted,
    total: submitted,
    graded: e.gradedCount ?? 0,
    status: statusVi(e.status),
    points: e.points ?? 10,
    questions: e.questionCount ?? 0,
    attempts: e.attemptCount ?? 0,
    learners: e.learnerCount ?? 0,
  };
}

export async function loadExercises(): Promise<void> {
  try {
    const folders: any[] = await exerciseFoldersApi.list();
    (DB as any).EX_FOLDERS = (folders ?? []).map((f: Record<string, any>) => ({
      id: String(f._id),
      name: f.name,
      parentId: f.parentId ? String(f.parentId) : null,
    }));
  } catch {
    (DB as any).EX_FOLDERS = [];
  }

  try {
    const res: any = await exercisesApi.list({ pageSize: 200 });
    const records: any[] = (res as any)?.records ?? [];

    const myStatus: Record<string, string> = {};
    try {
      const mineRes: any = await attemptsApi.mine();
      const mine: any[] = Array.isArray(mineRes) ? mineRes : [];
      for (const a of mine) {
        const exId = String(a?.exerciseId?._id ?? a?.exerciseId ?? '');
        if (!exId) continue;
        if (a?.status === 'graded') myStatus[exId] = 'graded';
        else if (a?.status === 'submitted' && myStatus[exId] !== 'graded') myStatus[exId] = 'done';
      }
    } catch { /* best-effort */ }

    (DB as any).ASSIGNMENTS = records.map(mapExercise);

    (DB as any).STUDENT_TASKS = records.map((e: Record<string, any>) => ({
      id: e._id,
      title: e.title,
      subject: e.subject ?? '',
      type: typeVi(e.type),
      due: formatDateVi(e.dueDate),
      dueIn: dueInVi(e.dueDate),
      status: myStatus[String(e._id)] ?? 'todo',
      points: e.points ?? 10,
      questions: e.questionCount ?? 0,
      attempts: e.attemptCount ?? 0,
      learners: e.learnerCount ?? 0,
    }));
  } catch {
    (DB as any).ASSIGNMENTS = [];
    (DB as any).STUDENT_TASKS = [];
  }
}
