'use client';
// Live loader: fills DB.ASSIGNMENTS and DB.STUDENT_TASKS from the exercises API.
//
// The exercise list (GET /exercises) gives the per-exercise meta + questionCount,
// but NOT how many attempts were submitted/graded. Those counts come from the
// attempts queue (GET /attempts — @Roles[Teacher,Admin]). We fetch that queue
// best-effort and aggregate per-exercise submitted/graded/total; a student (or a
// logged-out visitor) gets 401/403 there, so the counts simply stay 0 and every
// task status stays 'todo' (matching the previous hardcoded behaviour).
//
// For STUDENT_TASKS we additionally try to flip each task's status from the
// CURRENT user's own attempts (todo → done/graded) when those attempts are
// visible in the queue (teacher viewing their own, or any future student-scoped
// response). When no attempt is present the task stays 'todo'.

import { DB } from '@/app/data/db';
import { authApi, exercisesApi, attemptsApi } from '@/app/lib/api';
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

// Aggregated per-exercise attempt stats from the teacher attempts queue.
type ExStat = { submitted: number; graded: number; total: number };

export async function loadExercises(): Promise<void> {
  try {
    const res: any = await exercisesApi.list({ pageSize: 200 });
    const records: any[] = (res as any)?.records ?? [];

    // ── Best-effort: derive submitted/graded/total per exercise + the current
    //    user's own per-task status from the attempts queue. 401/403/down → {}.
    const stats: Record<string, ExStat> = {};
    const myStatus: Record<string, string> = {}; // exerciseId → 'done' | 'graded'
    try {
      let myId = '';
      try {
        const me: any = await authApi.me();
        myId = String(me?._id ?? me?.id ?? '');
      } catch { /* anonymous — leave myId empty */ }

      const aRes: any = await attemptsApi.list({ pageSize: 500 });
      const attempts: any[] = (aRes as any)?.records ?? [];
      for (const a of attempts) {
        const exId = String(a?.exerciseId?._id ?? a?.exerciseId ?? '');
        if (!exId) continue;
        const graded = a?.status === 'graded' || !!a?.submission?.isGraded;
        const s = (stats[exId] ??= { submitted: 0, graded: 0, total: 0 });
        s.total += 1;
        if (a?.submittedAt) s.submitted += 1; // queue only returns submitted, but guard anyway
        if (graded) s.graded += 1;
        // Flip this exercise's task status for the logged-in student.
        const studentId = String(a?.studentId?._id ?? a?.studentId ?? '');
        if (myId && studentId === myId) {
          if (graded) myStatus[exId] = 'graded';
          else if (myStatus[exId] !== 'graded') myStatus[exId] = 'done';
        }
      }
    } catch { /* not a teacher / logged out / API down → counts stay 0 */ }

    // Student-accessible source for the CURRENT user's own task status — works for
    // students too (the teacher queue above 403s for them). Authoritative for myStatus.
    try {
      const mineRes: any = await attemptsApi.mine();
      const mine: any[] = Array.isArray(mineRes) ? mineRes : [];
      for (const a of mine) {
        const exId = String(a?.exerciseId?._id ?? a?.exerciseId ?? '');
        if (!exId) continue;
        if (a?.status === 'graded') myStatus[exId] = 'graded';
        else if (a?.status === 'submitted' && myStatus[exId] !== 'graded') myStatus[exId] = 'done';
      }
    } catch { /* logged out → keep whatever the queue gave */ }

    (DB as any).ASSIGNMENTS = records.map((e: Record<string, any>) => {
      const st = stats[String(e._id)];
      return {
        id: e._id,
        title: e.title,
        // Keep `subject` as a neutral label only; do NOT put it in `class`, which
        // feeds the class filter (subject is not a class code → tasks vanish).
        class: '',
        subject: e.subject ?? '',
        type: typeVi(e.type),
        due: formatDateVi(e.dueDate),
        dueIn: dueInVi(e.dueDate),
        submitted: st?.submitted ?? 0,
        total: st?.total ?? 0,
        graded: st?.graded ?? 0,
        status: statusVi(e.status),
        points: e.points ?? 10,
        // questionCount is added by the backend list when available; 0 otherwise.
        questions: e.questionCount ?? 0,
        // attemptCount/learnerCount come from the backend list (public read).
        attempts: e.attemptCount ?? 0,
        learners: e.learnerCount ?? 0,
      };
    });

    (DB as any).STUDENT_TASKS = records.map((e: Record<string, any>) => ({
      id: e._id,
      title: e.title,
      // Neutral label, never the class-filter key (see above).
      class: '',
      subject: e.subject ?? '',
      type: typeVi(e.type),
      due: formatDateVi(e.dueDate),
      dueIn: dueInVi(e.dueDate),
      // Derive from the current user's own attempt when present, else 'todo'.
      status: myStatus[String(e._id)] ?? 'todo',
      points: e.points ?? 10,
      questions: e.questionCount ?? 0,
      attempts: e.attemptCount ?? 0,
      learners: e.learnerCount ?? 0,
    }));
  } catch {
    return;
  }
}
