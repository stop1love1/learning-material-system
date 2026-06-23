'use client';
// store.ts — tiny live data store so the LMS runs a full end-to-end flow.
// Mutates the DB collections in place + persists to localStorage, and notifies
// React via useLMS() so every screen re-renders on any change. Ported from
// store.jsx (the prototype's window.LMS + window.useLMS).
import React from 'react';
import { DB } from '@/app/data/db';

const KEY = 'lms-state-v3';
const COLLS = ['ASSIGNMENTS', 'QUESTIONS', 'RUBRICS', 'SUBMISSIONS', 'STUDENT_TASKS', 'DOCS', 'ARTICLES', 'DOWNLOADS'];
const hasWindow = typeof window !== 'undefined';

// hydrate from a previous session
if (hasWindow) {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) COLLS.forEach((k) => { if (Array.isArray(saved[k])) DB[k] = saved[k]; });
  } catch {}
}

let ver = 0;
const subs = new Set<(v: number) => void>();

function persist() {
  if (!hasWindow) return;
  try {
    const o: Record<string, any> = {};
    COLLS.forEach((k) => (o[k] = DB[k]));
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch {}
}

function bump() {
  ver++;
  persist();
  subs.forEach((fn) => fn(ver));
}

const uid = (pre: string) => pre + Math.random().toString(36).slice(2, 8);

export const LMS = {
  bump,
  reset() {
    if (!hasWindow) return;
    try { localStorage.removeItem(KEY); } catch {}
    location.reload();
  },

  addQuestion(q: Record<string, any>) {
    DB.QUESTIONS.unshift({ id: uid('q'), uses: 0, updated: 'Vừa xong', author: 'Cô Mai Anh', topic: 'Mới tạo', ...q });
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
    // surface it to the student immediately
    DB.STUDENT_TASKS.unshift({ id, title: a.title, class: a.class, type: a.type, due: a.due,
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
    DB.DOCS.unshift({ id: uid('d'), type: 'doc', size: '1,0 MB', folder: 'Tư liệu', updated: 'Vừa xong', by: 'Cô Mai Anh', downloads: 0, ...d });
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

/** Subscribe a component to any LMS mutation — forces a re-render on bump(). */
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
