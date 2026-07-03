'use client';
import React from 'react';

type Rec = Record<string, any>;

const QTYPES: Rec[] = [
  { id: 'single', label: 'Trắc nghiệm 1 đáp án', icon: 'checkCircle', short: '1 đáp án' },
  { id: 'multi', label: 'Trắc nghiệm nhiều đáp án', icon: 'check', short: 'Nhiều đáp án' },
  { id: 'truefalse', label: 'Đúng / Sai', icon: 'target', short: 'Đúng/Sai' },
  { id: 'fill', label: 'Điền khuyết', icon: 'pen', short: 'Điền khuyết' },
  { id: 'essay', label: 'Tự luận (viết đoạn, bài văn)', icon: 'docs', short: 'Tự luận' },
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

export const LMS = {
  bump,
  reset() {
    if (!hasWindow) return;
    try { localStorage.removeItem(LEGACY_KEY); } catch {}
    location.reload();
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
