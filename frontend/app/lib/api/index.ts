'use client';
import { api, qs } from './client';

export * from './client';

export type AuthResult = { accessToken: string; user: Record<string, any> };

export const authApi = {
  login: (email: string, password: string) => api.post<AuthResult>('/auth/login', { email, password }, { auth: false }),
  // Registration no longer auto-logs-in: the account is created unverified and an
  // email-verification link is sent. In dev (no SMTP) the link is returned as `devVerifyLink`.
  register: (name: string, email: string, password: string) =>
    api.post<{ ok: true; needsVerification?: boolean; devVerifyLink?: string }>(
      '/auth/register',
      { name, email, password },
      { auth: false },
    ),
  // Confirm an email-verification token → activates the account and auto-logs-in.
  verifyEmail: (token: string) =>
    api.post<{ ok: true; accessToken: string; user: Record<string, any> }>('/auth/verify-email', { token }, { auth: false }),
  // Re-send the verification email. In dev the link is returned as `devVerifyLink`.
  resendVerification: (email: string) =>
    api.post<{ ok: true; devVerifyLink?: string }>('/auth/resend-verification', { email }, { auth: false }),
  // Sign in with a Google ID token (credential from @react-oauth/google).
  google: (idToken: string) => api.post<AuthResult>('/auth/google', { idToken }, { auth: false }),
  // Step 2 of email-OTP 2FA: exchange the 6-digit code for a session.
  verify2fa: (email: string, code: string) =>
    api.post<AuthResult>('/auth/verify-2fa', { email, code }, { auth: false }),
  me: () => api.get<Record<string, any>>('/auth/me'),
  updateMe: (body: { name?: string; email?: string; avatar?: string }) => api.patch<Record<string, any>>('/auth/me', body),
  // Server-side logout (best-effort token revocation). Frontend clears the token regardless.
  logout: () => api.post('/auth/logout'),
  // Silent session extension. Returns a fresh accessToken for the current user.
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),
  // Password recovery. forgotPassword always 200 (no user enumeration); in dev the reset
  // token/link is returned in `devToken`/`devResetLink` when SMTP is not configured.
  forgotPassword: (email: string) =>
    api.post<{ ok: true; devToken?: string; devResetLink?: string }>('/auth/forgot-password', { email }, { auth: false }),
  resetPassword: (token: string, password: string) =>
    api.post<{ ok: true }>('/auth/reset-password', { token, password }, { auth: false }),
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

export const exerciseFoldersApi = {
  list: (parentId?: string) => api.get<any[]>(`/exercise-folders${qs({ parentId })}`, { auth: false }),
  create: (body: any) => api.post('/exercise-folders', body),
  update: (id: string, body: any) => api.patch(`/exercise-folders/${id}`, body),
  remove: (id: string) => api.del(`/exercise-folders/${id}`),
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

export const attemptsApi = {
  start: (exerciseId: string) => api.post<any>('/attempts/start', { exerciseId }),
  submit: (attemptId: string, answers: any[]) => api.post<any>(`/attempts/${attemptId}/submit`, { answers }),
  result: (attemptId: string) => api.get<any>(`/attempts/${attemptId}/result`),
  grade: (attemptId: string, body: any) => api.patch<any>(`/attempts/${attemptId}/grade`, body),
  // pendingOnly: attempts whose submission is missing or not yet graded.
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/attempts${qs(q)}`),
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
  // Admin content backup: export returns a JSON snapshot; import restores it (upsert by _id).
  export: () => api.get<any>('/settings/export'),
  import: (snapshot: any) => api.post<{ ok: true; restored: Record<string, number> }>('/settings/import', { snapshot }),
};

export const usersApi = {
  list: (q: Record<string, unknown> = {}) => api.get<any>(`/users${qs(q)}`),
  get: (id: string) => api.get<any>(`/users/${id}`),
  create: (body: any) => api.post('/users', body),
  update: (id: string, body: any) => api.patch(`/users/${id}`, body),
  remove: (id: string) => api.del(`/users/${id}`),
};

export const statsApi = {
  overview: () => api.get<any>('/stats/overview'),
  reports: () => api.get<any>('/stats/reports'),
};

export const notificationsApi = {
  // Teacher/Admin derived feed (existing).
  list: (limit = 20) => api.get<any[]>(`/notifications${qs({ limit })}`),
  // Personal stored notifications for the current authed user (any role), newest first.
  me: (limit = 20) => api.get<any[]>(`/notifications/me${qs({ limit })}`),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

export const scheduleApi = {
  today: () => api.get<any[]>('/schedule/today'),
  list: () => api.get<any[]>('/schedule'),
  create: (body: any) => api.post('/schedule', body),
  update: (id: string, body: any) => api.patch(`/schedule/${id}`, body),
  remove: (id: string) => api.del(`/schedule/${id}`),
};
