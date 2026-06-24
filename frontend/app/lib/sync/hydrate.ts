'use client';
// hydrate.ts — orchestrator that fills the in-memory DB with LIVE backend data
// for the current route, then bumps the store so subscribed screens re-render.
// Each loader is best-effort and swallows its own errors, so the app keeps using
// mock data when the API is unavailable / the user is logged out.
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

// Which collections each route needs (by the design's internal routeKey).
const BY_ROUTE: Record<string, Loader[]> = {
  // public
  home: [loadLibrary, loadArticles],
  's-docs': [loadLibrary],
  's-doc': [loadLibrary],
  's-mine': [loadLibrary],
  's-tasks': [loadExercises],
  's-task': [loadExercises],
  's-selfcheck': [loadRubrics],
  blog: [loadArticles],
  article: [loadArticles],
  // admin
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

/** Fetch the live collections needed by `routeKey` into DB, then re-render. */
export async function hydrateFor(routeKey?: string): Promise<void> {
  const loaders = routeKey ? BY_ROUTE[routeKey] : undefined;
  if (!loaders?.length) return;
  await Promise.allSettled(loaders.map((l) => l()));
  LMS.bump();
}
