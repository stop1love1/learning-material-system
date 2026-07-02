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

type Loader = () => Promise<void>;

const BY_ROUTE: Record<string, Loader[]> = {
  home: [loadLibrary, loadArticles, loadExercises],
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
  'a-overview': [loadStats, loadLibrary, loadArticles, loadExercises, loadUsers],
  'a-reports': [loadReports],
  notify: [loadNotifications],
};

// First-load tracking: screens read DB synchronously, so on a fresh page load
// they'd render empty until the loaders finish. ScreenHost uses this to show a
// loading state for the FIRST hydration of each route (later visits show the
// already-loaded data and refresh silently).
const hydratedOnce = new Set<string>();

/** True from the very first render until the route's loaders complete once. */
export function isFirstHydrating(routeKey?: string): boolean {
  if (!routeKey) return false;
  return !!BY_ROUTE[routeKey]?.length && !hydratedOnce.has(routeKey);
}

/** Load live collections for `routeKey` into DB, then bump subscribers. */
export async function hydrateFor(routeKey?: string): Promise<void> {
  const loaders = routeKey ? BY_ROUTE[routeKey] : undefined;
  if (!loaders?.length) return;
  try {
    await Promise.allSettled(loaders.map((l) => l()));
  } finally {
    hydratedOnce.add(routeKey!);
    LMS.bump();
  }
}
