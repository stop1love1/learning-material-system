'use client';
// Typed endpoint helpers for every backend resource. Public reads pass { auth:false }.
import { api, qs } from './client';

export * from './client';

export type AuthResult = { accessToken: string; user: Record<string, any> };

export const authApi = {
  login: (email: string, password: string) => api.post<AuthResult>('/auth/login', { email, password }, { auth: false }),
  register: (name: string, email: string, password: string) =>
    api.post<AuthResult>('/auth/register', { name, email, password }, { auth: false }),
  me: () => api.get<Record<string, any>>('/auth/me'),
  updateMe: (body: { name?: string; email?: string; avatar?: string }) => api.patch<Record<string, any>>('/auth/me', body),
};

export const foldersApi = {
  list: (parentId?: string) => api.get<any[]>(`/folders${qs({ parentId })}`, { auth: false }),
  create: (body: any) => api.post('/folders', body),
  update: (id: string, body: any) => api.patch(`/folders/${id}`, body),
  remove: (id: string) => api.del(`/folders/${id}`),
};

export const filesApi = {
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/files${qs(q)}`, { auth: false }),
  get: (id: string) => api.get<any>(`/files/${id}`, { auth: false }),
  create: (body: any) => api.post('/files', body),
  update: (id: string, body: any) => api.patch(`/files/${id}`, body),
  remove: (id: string) => api.del(`/files/${id}`),
  download: (id: string) => api.post(`/files/${id}/download`),
  myDownloads: () => api.get<any[]>('/files/me/downloads'),
};

export const topicsApi = {
  list: (parentId?: string) => api.get<any[]>(`/topics${qs({ parentId })}`),
  create: (body: any) => api.post('/topics', body),
  update: (id: string, body: any) => api.patch(`/topics/${id}`, body),
  remove: (id: string) => api.del(`/topics/${id}`),
};

export const questionsApi = {
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/questions${qs(q)}`),
  get: (id: string) => api.get<any>(`/questions/${id}`),
  create: (body: any) => api.post('/questions', body),
  update: (id: string, body: any) => api.patch(`/questions/${id}`, body),
  remove: (id: string) => api.del(`/questions/${id}`),
};

export const rubricsApi = {
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/rubrics${qs(q)}`),
  get: (id: string) => api.get<any>(`/rubrics/${id}`),
  create: (body: any) => api.post('/rubrics', body),
  update: (id: string, body: any) => api.patch(`/rubrics/${id}`, body),
  remove: (id: string) => api.del(`/rubrics/${id}`),
  groups: () => api.get<any[]>('/rubric-groups'),
};

export const exercisesApi = {
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/exercises${qs(q)}`),
  get: (id: string) => api.get<any>(`/exercises/${id}`),
  create: (body: any) => api.post('/exercises', body),
  update: (id: string, body: any) => api.patch(`/exercises/${id}`, body),
  remove: (id: string) => api.del(`/exercises/${id}`),
  addQuestion: (id: string, body: any) => api.post(`/exercises/${id}/questions`, body),
  startAttempt: (exerciseId: string) => api.post('/attempts/start', { exerciseId }),
  submitAttempt: (attemptId: string, answers: any[]) => api.post(`/attempts/${attemptId}/submit`, { answers }),
  result: (attemptId: string) => api.get(`/attempts/${attemptId}/result`),
};

// Attempt lifecycle + teacher grading (all require a bearer token).
export const attemptsApi = {
  start: (exerciseId: string) => api.post<any>('/attempts/start', { exerciseId }),
  submit: (attemptId: string, answers: any[]) => api.post<any>(`/attempts/${attemptId}/submit`, { answers }),
  result: (attemptId: string) => api.get<any>(`/attempts/${attemptId}/result`),
  // Teacher: persist per-answer grades + optional overall score/percent/feedback.
  grade: (attemptId: string, body: any) => api.patch<any>(`/attempts/${attemptId}/grade`, body),
  // Teacher: submitted-attempts queue (pagination envelope). pendingOnly filters
  // to attempts whose submission is missing or not yet graded.
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/attempts${qs(q)}`),
  // Student: my own attempts (status + score per exercise).
  mine: () => api.get<any[]>('/attempts/me'),
};
// Alias to match the "submissions" naming used by the grading screen/loader.
export const submissionsApi = attemptsApi;

export const selfAssessmentsApi = {
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/self-assessments${qs(q)}`),
  create: (body: any) => api.post('/self-assessments', body),
};

export const articlesApi = {
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/articles${qs(q)}`, { auth: false }),
  get: (id: string) => api.get<any>(`/articles/${id}`, { auth: false }),
  create: (body: any) => api.post('/articles', body),
  update: (id: string, body: any) => api.patch(`/articles/${id}`, body),
  remove: (id: string) => api.del(`/articles/${id}`),
};

export const settingsApi = {
  get: () => api.get<any>('/settings', { auth: false }),
  update: (body: any) => api.patch('/settings', body),
};

export const usersApi = {
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/users${qs(q)}`),
  get: (id: string) => api.get<any>(`/users/${id}`),
  create: (body: any) => api.post('/users', body),
  update: (id: string, body: any) => api.patch(`/users/${id}`, body),
  remove: (id: string) => api.del(`/users/${id}`),
};

// Dashboard + báo cáo: số liệu thật tổng hợp từ backend (admin/teacher).
export const statsApi = {
  overview: () => api.get<any>('/stats/overview'),
  reports: () => api.get<any>('/stats/reports'),
};

// Bảng tin hoạt động (tổng hợp sự kiện gần đây).
export const notificationsApi = {
  list: (limit = 20) => api.get<any[]>(`/notifications${qs({ limit })}`),
};
