'use client';
// List endpoint omits answer bodies; detail via GET /attempts/:id/result.
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

function wordCount(text: string): number {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

function answerText(answer: any): string {
  if (answer == null) return '';
  if (typeof answer === 'string') return answer;
  if (typeof answer === 'number' || typeof answer === 'boolean') return String(answer);
  if (Array.isArray(answer)) return answer.map((x) => answerText(x)).filter(Boolean).join(', ');
  if (typeof answer === 'object') {
    if (typeof answer.text === 'string') return answer.text;
    return '';
  }
  return '';
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
        assignmentId: ex?._id ?? ex ?? '',
        studentId: student?._id ?? '',
        name: student?.name ?? 'Học viên ẩn danh',
        code: codeFrom(student),
        at: atVi(a.submittedAt),
        status: graded ? 'graded' : 'ungraded',
        ...(graded && score != null ? { score } : {}),
        loaded: false,
        wordcount: 0,
        text: '',
        questions: [] as any[],
      };
    });
  } catch {
    (DB as any).SUBMISSIONS = [];
  }
}

/** Fetch attempt result and merge text/questions into DB.SUBMISSIONS (best-effort). */
export async function loadSubmissionDetail(attemptId: string): Promise<void> {
  if (!attemptId) return;
  try {
    const res: any = await attemptsApi.result(attemptId);
    const sqs: any[] = (res?.studentQuestions ?? []) as any[];
    const submission = res?.submission ?? null;

    const questions = sqs.map((sq: Record<string, any>) => ({
      questionId: String(sq.questionId?._id ?? sq.questionId ?? ''),
      text: answerText(sq.answer),
      grades: typeof sq.grades === 'number' ? sq.grades : null,
      isCorrect: typeof sq.isCorrect === 'boolean' ? sq.isCorrect : null,
      feedback: sq.feedback ?? '',
    }));
    const text = questions.map((q) => q.text).filter(Boolean).join('\n\n');

    const list: any[] = (DB as any).SUBMISSIONS ?? [];
    const rec = list.find((s: any) => s.attemptId === attemptId || s.id === attemptId);
    if (rec) {
      rec.text = text;
      rec.wordcount = wordCount(text);
      rec.questions = questions;
      rec.loaded = true;
      if (submission?.feedback != null) rec.feedback = submission.feedback;
    }
  } catch {
    /* best-effort */
  }
}
