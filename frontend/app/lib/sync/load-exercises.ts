'use client';
// GET /exercises records now carry submittedCount/gradedCount/learnerCount/etc.,
// so the list no longer needs the bulk /attempts fetch. The per-student "đã làm"
// status overlay (myStatus) still uses /attempts/me — but only for the legacy
// DB.STUDENT_TASKS feed (home/overview), not the hook-driven lists.
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

// Map backend ExerciseStatus (draft|open|closing|closed) → assign.tsx values (open|closing|done).
export function statusVi(s: string): string {
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

/**
 * Map one /exercises record into the assignment/list shape. submitted/graded come
 * straight from the record's submittedCount/gradedCount (no bulk attempts fetch).
 * `total` = submitted (the record has no separate total-attempts that isn't the
 * submitted count for the teacher list). Shared by the loader + paged list hook.
 */
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
  // Exercise folder tree (best-effort): "Kho đề thi" + "Bài tập" are browsed as a
  // folder hierarchy. Stored flat as { id, name, parentId } for <FolderTree>.
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

    // Per-student task status for the home/overview feed (the hook-driven lists
    // get their own server filters instead). Best-effort: logged-out → all 'todo'.
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
    } catch { /* logged out → keep 'todo' */ }

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
