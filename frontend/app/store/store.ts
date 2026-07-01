'use client';
import React from 'react';

type Rec = Record<string, any>;

const QTYPES: Rec[] = [
  { id: 'single', label: 'Trắc nghiệm 1 đáp án', icon: 'checkCircle', short: '1 đáp án' },
  { id: 'multi', label: 'Trắc nghiệm nhiều đáp án', icon: 'check', short: 'Nhiều đáp án' },
  { id: 'truefalse', label: 'Đúng / Sai', icon: 'target', short: 'Đúng/Sai' },
  { id: 'fill', label: 'Điền khuyết', icon: 'pen', short: 'Điền khuyết' },
  { id: 'essay', label: 'Tự luận (tập làm văn)', icon: 'docs', short: 'Tự luận' },
  { id: 'match', label: 'Nối / kéo thả', icon: 'link', short: 'Nối/kéo thả' },
];
const LEVELS: Rec[] = [
  { id: 'easy', label: 'Nhận biết', color: '#4f8a44' },
  { id: 'medium', label: 'Thông hiểu', color: '#b4842a' },
  { id: 'hard', label: 'Vận dụng', color: '#b35338' },
];

export const DB: Record<string, any> = {
  QTYPES,
  LEVELS,
  QUESTIONS: [] as Rec[],
  DOCS: [] as Rec[],
  DOC_FOLDERS: ['Tất cả'] as string[],
  DOWNLOADS: [] as string[],
  RUBRICS: [] as Rec[],
  ASSIGNMENTS: [] as Rec[],
  SUBMISSIONS: [] as Rec[],
  NOTICES: [] as Rec[],
  STUDENT_TASKS: [] as Rec[],
  ARTICLES: [] as Rec[],
  ADMIN_STATS: {
    users: 0, docs: 0, exercises: 0, articles: 0, questions: 0,
    attempts: 0, submissions: 0, graded: 0, ungraded: 0,
    enrollTrend: [] as number[], enrollDates: [] as string[],
  } as Rec,
  ADMIN_USERS: [] as Rec[],
};

const LEGACY_KEY = 'lms-state-v3';
const hasWindow = typeof window !== 'undefined';

if (hasWindow) { try { localStorage.removeItem(LEGACY_KEY); } catch {} }

let ver = 0;
const subs = new Set<(v: number) => void>();

function bump() {
  ver++;
  subs.forEach((fn) => fn(ver));
}

const uid = (pre: string) => pre + Math.random().toString(36).slice(2, 8);

export const LMS = {
  bump,
  reset() {
    if (!hasWindow) return;
    try { localStorage.removeItem(LEGACY_KEY); } catch {}
    location.reload();
  },

  addQuestion(q: Record<string, any>) {
    DB.QUESTIONS.unshift({ id: uid('q'), uses: 0, updated: 'Vừa xong', author: 'Cô Phương Thanh', topic: 'Mới tạo', ...q });
    bump();
  },

  saveRubric(r: Record<string, any>) {
    const i = DB.RUBRICS.findIndex((x: any) => x.id === r.id);
    if (i >= 0) DB.RUBRICS[i] = { ...r };
    else DB.RUBRICS.unshift({ ...r, id: uid('r'), used: 0 });
    bump();
  },

  addAssignment(a: Record<string, any>) {
    const id = uid('a');
    DB.ASSIGNMENTS.unshift({ id, submitted: 0, graded: 0, status: 'open', ...a });
    DB.STUDENT_TASKS.unshift({ id, title: a.title, type: a.type, due: a.due,
      dueIn: a.dueIn || 'Mới giao', status: 'todo', points: a.points, questions: a.questions });
    bump();
    return id;
  },

  submitAssignment(taskId: string, payload?: { wordcount?: number; text?: string }) {
    const task = DB.STUDENT_TASKS.find((x: any) => x.id === taskId);
    if (task) task.status = 'done';
    const a = DB.ASSIGNMENTS.find((x: any) => x.id === taskId);
    if (a) a.submitted = (a.submitted || 0) + 1;
    DB.SUBMISSIONS.unshift({
      id: uid('sub'), assignmentId: taskId, studentId: 's1', name: 'Nguyễn Thu Hà', code: 'HS2401',
      at: 'Vừa xong', status: 'ungraded', wordcount: (payload && payload.wordcount) || 0,
      text: (payload && payload.text) || 'Học viên đã hoàn thành và nộp bài trắc nghiệm.',
    });
    bump();
  },

  gradeSubmission(subId: string, score: number | string, feedback?: string) {
    const s = DB.SUBMISSIONS.find((x: any) => x.id === subId);
    if (!s) return;
    const wasGraded = s.status === 'graded';
    s.status = 'graded';
    s.score = Number(score) || 0;
    s.feedback = feedback || '';
    if (!wasGraded) {
      const a = DB.ASSIGNMENTS.find((x: any) => x.id === s.assignmentId);
      if (a) a.graded = (a.graded || 0) + 1;
    }
    bump();
  },

  addDoc(d: Record<string, any>) {
    DB.DOCS.unshift({ id: uid('d'), type: 'doc', size: '1,0 MB', folder: 'Tư liệu', updated: 'Vừa xong', by: 'Cô Phương Thanh', downloads: 0, ...d });
    bump();
  },

  addArticle(a: Record<string, any>) {
    DB.ARTICLES.unshift({ id: uid('b'), cat: 'Bài viết', author: 'Quản trị', date: 'Hôm nay', read: '4 phút', cover: 'clay',
      excerpt: (a.body && a.body[0]) ? a.body[0].slice(0, 110) : '', ...a });
    bump();
  },

  download(docId: string) {
    DB.DOWNLOADS = DB.DOWNLOADS || [];
    const d = DB.DOCS.find((x: any) => x.id === docId);
    if (d) d.downloads = (d.downloads || 0) + 1;
    if (!DB.DOWNLOADS.includes(docId)) DB.DOWNLOADS = [docId, ...DB.DOWNLOADS];
    bump();
  },
};

export function useLMS() {
  const set = React.useState(0)[1];
  React.useEffect(() => {
    const fn = (v: number) => set(v);
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }, [set]);
}
