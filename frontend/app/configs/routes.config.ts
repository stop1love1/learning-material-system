// routes.config.ts — central route config for the LMS (the single place that maps
// the design's internal route keys ↔ real URLs). Slugs are Vietnamese (kebab-case,
// no diacritics), matching the menu labels. Mirrors the reference app's
// routes.config convention: no magic path strings scattered in components.

/** Canonical URLs. Functions take a detail id. */
export const ROUTES = {
  // ── Khu vực công khai (site) ──
  home: '/',
  library: '/kho-hoc-lieu', // Kho tài liệu
  libraryItem: (id: string) => `/kho-hoc-lieu/${id}`,
  practice: '/luyen-tap', // Luyện tập
  practiceItem: (id: string) => `/luyen-tap/${id}`,
  selfCheck: '/tu-danh-gia', // Tự đánh giá
  blog: '/bai-viet', // Bài viết
  blogPost: (id: string) => `/bai-viet/${id}`,
  myLibrary: '/cua-toi', // Của tôi
  // ── Khu vực quản trị (/quan-tri) ──
  dashboard: '/quan-tri', // Tổng quan
  dashLibrary: '/quan-tri/kho-hoc-lieu', // Kho tài liệu
  questionBank: '/quan-tri/ngan-hang-cau-hoi', // Ngân hàng câu hỏi
  questionNew: '/quan-tri/ngan-hang-cau-hoi/soan', // Soạn câu hỏi
  assignments: '/quan-tri/bai-tap', // Bài tập
  assignmentNew: '/quan-tri/bai-tap/giao-bai', // Giao bài tập mới
  rubrics: '/quan-tri/rubrics', // Rubrics
  rubricNew: '/quan-tri/rubrics/tao', // Tạo rubric
  rubricEdit: (id: string) => `/quan-tri/rubrics/${id}`,
  dashBlog: '/quan-tri/bai-viet', // Bài viết / Blog
  grade: '/quan-tri/cham-bai', // Chấm bài
  gradeOne: (id: string) => `/quan-tri/cham-bai/${id}`,
  users: '/quan-tri/nguoi-dung', // Người dùng
  reports: '/quan-tri/bao-cao', // Báo cáo & Thống kê
  settings: '/quan-tri/cai-dat', // Cài đặt hệ thống
  notifications: '/quan-tri/thong-bao', // Nhật ký & thông báo
} as const;

type Patch = Record<string, string> | undefined;

/**
 * Translate a design "route key" (the strings passed to the prototype's
 * setRoute()/go()) + optional context patch into a real URL. Unknown keys fall
 * back to the closest sensible landing page.
 */
export function routeToHref(key: string, patch?: Patch): string {
  const id = (k: string) => (patch && patch[k]) || '';
  switch (key) {
    // public
    case 'home': return ROUTES.home;
    case 's-docs': return ROUTES.library;
    case 's-doc': return ROUTES.libraryItem(id('doc'));
    case 's-tasks': return ROUTES.practice;
    case 's-task': return ROUTES.practiceItem(id('task'));
    case 's-selfcheck': return ROUTES.selfCheck;
    case 'blog': return ROUTES.blog;
    case 'article': return ROUTES.blogPost(id('article'));
    case 's-mine': return ROUTES.myLibrary;
    // admin
    case 'a-overview': return ROUTES.dashboard;
    case 'docs': return ROUTES.dashLibrary;
    case 'bank': return ROUTES.questionBank;
    case 'bank-edit': return ROUTES.questionNew;
    case 'assignments': return ROUTES.assignments;
    case 'assign-new': return ROUTES.assignmentNew;
    case 'rubrics': return ROUTES.rubrics;
    case 'rubric-edit': return patch && patch.rubric ? ROUTES.rubricEdit(patch.rubric) : ROUTES.rubricNew;
    case 'a-blog': return ROUTES.dashBlog;
    case 'grade': return ROUTES.grade;
    case 'grade-one': return ROUTES.gradeOne(id('assignment'));
    case 'a-users': return ROUTES.users;
    case 'a-reports': return ROUTES.reports;
    case 'a-settings': return ROUTES.settings;
    case 'settings': return ROUTES.settings;
    case 'notify': return ROUTES.notifications;
    // legacy / unrouted teacher+student keys → nearest landing
    case 'classes':
    case 'class': return ROUTES.dashboard;
    default: return ROUTES.home;
  }
}

/**
 * Resolve a pathname to the active nav key (for sidebar/header highlight) and
 * the specific route key (for the page title lookup in PAGE_TITLES).
 */
export function resolvePath(pathname: string): { routeKey: string; navKey: string } {
  const seg = (pathname || '/').replace(/\/+$/, '') || '/';
  const r = (routeKey: string, navKey: string) => ({ routeKey, navKey });

  // ── quản trị ──
  if (seg === '/quan-tri') return r('a-overview', 'a-overview');
  if (seg.startsWith('/quan-tri/ngan-hang-cau-hoi/soan')) return r('bank-edit', 'bank');
  if (seg.startsWith('/quan-tri/ngan-hang-cau-hoi')) return r('bank', 'bank');
  if (seg.startsWith('/quan-tri/bai-tap/giao-bai')) return r('assign-new', 'assignments');
  if (seg.startsWith('/quan-tri/bai-tap')) return r('assignments', 'assignments');
  if (seg.startsWith('/quan-tri/rubrics/tao')) return r('rubric-edit', 'rubrics');
  if (/^\/quan-tri\/rubrics\/[^/]+/.test(seg)) return r('rubric-edit', 'rubrics');
  if (seg.startsWith('/quan-tri/rubrics')) return r('rubrics', 'rubrics');
  if (seg.startsWith('/quan-tri/kho-hoc-lieu')) return r('docs', 'docs');
  if (seg.startsWith('/quan-tri/bai-viet')) return r('a-blog', 'a-blog');
  if (/^\/quan-tri\/cham-bai\/[^/]+/.test(seg)) return r('grade-one', 'grade');
  if (seg.startsWith('/quan-tri/cham-bai')) return r('grade', 'grade');
  if (seg.startsWith('/quan-tri/nguoi-dung')) return r('a-users', 'a-users');
  if (seg.startsWith('/quan-tri/bao-cao')) return r('a-reports', 'a-reports');
  if (seg.startsWith('/quan-tri/cai-dat')) return r('a-settings', 'a-settings');
  if (seg.startsWith('/quan-tri/thong-bao')) return r('notify', 'notify');

  // ── công khai ──
  if (/^\/kho-hoc-lieu\/[^/]+/.test(seg)) return r('s-doc', 's-docs');
  if (seg.startsWith('/kho-hoc-lieu')) return r('s-docs', 's-docs');
  if (/^\/luyen-tap\/[^/]+/.test(seg)) return r('s-task', 's-tasks');
  if (seg.startsWith('/luyen-tap')) return r('s-tasks', 's-tasks');
  if (seg.startsWith('/tu-danh-gia')) return r('s-selfcheck', 's-selfcheck');
  if (/^\/bai-viet\/[^/]+/.test(seg)) return r('article', 'blog');
  if (seg.startsWith('/bai-viet')) return r('blog', 'blog');
  if (seg.startsWith('/cua-toi')) return r('s-mine', 's-mine');
  return r('home', 'home');
}
