'use client';
import { LMS } from '@/app/store/store';
import { loadLibrary } from './load-library';
import { loadArticles } from './load-articles';
import { loadUsers } from './load-users';
import { loadQuestions } from './load-questions';
import { loadRubrics } from './load-rubrics';
import { loadExercises } from './load-exercises';
import { loadSubmissions } from './load-submissions';
import { loadStats } from './load-stats';
import { loadReports } from './load-reports';
import { loadNotifications } from './load-notifications';
import { loadSchedule } from './load-schedule';
import { loadClasses } from './load-classes';

type Loader = () => Promise<void>;

const BY_ROUTE: Record<string, Loader[]> = {
  home: [loadLibrary, loadArticles],
  's-docs': [loadLibrary],
  's-doc': [loadLibrary],
  's-mine': [loadLibrary],
  's-tasks': [loadExercises],
  's-task': [loadExercises],
  's-selfcheck': [loadRubrics],
  blog: [loadArticles],
  article: [loadArticles],
  docs: [loadLibrary],
  bank: [loadQuestions],
  'bank-edit': [loadQuestions],
  rubrics: [loadRubrics],
  'rubric-edit': [loadRubrics],
  assignments: [loadExercises],
  'assign-new': [loadExercises],
  grade: [loadExercises, loadSubmissions],
  'grade-one': [loadExercises, loadSubmissions],
  'a-blog': [loadArticles],
  'a-users': [loadUsers],
  'a-overview': [loadStats, loadLibrary, loadArticles, loadExercises, loadUsers, loadSchedule],
  'a-reports': [loadReports],
  'a-classes': [loadClasses],
  notify: [loadNotifications],
};

/** Fetch the live collections needed by `routeKey` into DB, then re-render. */
export async function hydrateFor(routeKey?: string): Promise<void> {
  const loaders = routeKey ? BY_ROUTE[routeKey] : undefined;
  if (!loaders?.length) return;
  await Promise.allSettled(loaders.map((l) => l()));
  LMS.bump();
}
