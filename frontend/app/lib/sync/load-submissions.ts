'use client';
// Live loader: fills DB.SUBMISSIONS from the teacher attempts queue
// (GET /attempts — @Roles[Teacher,Admin]). Best-effort: 401/403/API-down → mock.
//
// The grading screens (screens/grade.tsx) read DB.SUBMISSIONS with these fields:
//   id, assignmentId (← exercise _id, matches DB.ASSIGNMENTS[].id after loadExercises),
//   studentId, name (student display name), code (short id badge), at (submitted-at label),
//   status ('graded' | 'ungraded'), score (when graded), wordcount, text (essay body).
// The list endpoint only gives the queue + summary scores (no per-answer body), so
// `text`/`wordcount` are left blank here; the per-question content comes from the
// result endpoint when an individual attempt is opened.

import { DB } from '@/app/data/db';
import { attemptsApi } from '@/app/lib/api';

// "24/06 · 19:42" style submitted-at label, matching the mock vocabulary.
function atVi(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} · ${hh}:${mi}`;
}

// Short student code badge (e.g. "HS…2407") from the populated student id.
function codeFrom(student: any): string {
  const id = student?._id;
  if (!id) return '';
  const s = String(id);
  return s.length > 6 ? `HS${s.slice(-4).toUpperCase()}` : `HS${s.toUpperCase()}`;
}

export async function loadSubmissions(): Promise<void> {
  try {
    const res: any = await attemptsApi.list({ pageSize: 200 });
    const records: any[] = (res as any)?.records ?? [];
    if (!Array.isArray(records) || records.length === 0) return;

    (DB as any).SUBMISSIONS = records.map((a: Record<string, any>) => {
      const ex = a.exerciseId; // populated { _id, title, type, points }
      const student = a.studentId; // populated { _id, name, email, avatar } or null (guest)
      const sub = a.submission; // Submission | null
      const graded = a.status === 'graded' || !!sub?.isGraded;
      const score =
        typeof sub?.totalScore === 'number'
          ? sub.totalScore
          : typeof sub?.totalGrades === 'number'
          ? sub.totalGrades
          : undefined;
      return {
        id: a._id,
        attemptId: a._id,
        // assignmentId must line up with DB.ASSIGNMENTS[].id (= exercise _id).
        assignmentId: ex?._id ?? ex ?? '',
        studentId: student?._id ?? '',
        name: student?.name ?? 'Học viên ẩn danh',
        code: codeFrom(student),
        at: atVi(a.submittedAt),
        status: graded ? 'graded' : 'ungraded',
        ...(graded && score != null ? { score } : {}),
        // Per-answer body lives behind GET /attempts/:id/result; the queue has no text.
        wordcount: 0,
        text: '',
      };
    });
  } catch {
    // API down / not teacher (401/403) → leave DB.SUBMISSIONS as mock.
    return;
  }
}
