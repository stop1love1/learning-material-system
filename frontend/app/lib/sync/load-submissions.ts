'use client';
// List endpoint has no per-answer body — text/wordcount filled when opening GET /attempts/:id/result.
import { DB } from '@/app/store/store';
import { attemptsApi } from '@/app/lib/api';

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

    (DB as any).SUBMISSIONS = (Array.isArray(records) ? records : []).map((a: Record<string, any>) => {
      const ex = a.exerciseId;
      const student = a.studentId;
      const sub = a.submission;
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
    (DB as any).SUBMISSIONS = [];
  }
}
