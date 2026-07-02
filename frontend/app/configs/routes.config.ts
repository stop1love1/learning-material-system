export const ROUTES = {
  home: '/',
  library: '/kho-hoc-lieu',
  libraryItem: (id: string) => `/kho-hoc-lieu/${id}`,
  practice: '/luyen-tap',
  practiceItem: (id: string) => `/luyen-tap/${id}`,
  selfCheck: '/tu-danh-gia',
  blog: '/bai-viet',
  blogPost: (id: string) => `/bai-viet/${id}`,
  myLibrary: '/cua-toi',
  about: '/gioi-thieu',
  guide: '/huong-dan',
  contact: '/lien-he',
  terms: '/dieu-khoan',
  dashboard: '/quan-tri',
  dashLibrary: '/quan-tri/kho-hoc-lieu',
  questionBank: '/quan-tri/ngan-hang-cau-hoi',
  questionNew: '/quan-tri/ngan-hang-cau-hoi/soan',
  assignments: '/quan-tri/bai-tap',
  assignmentNew: '/quan-tri/bai-tap/giao-bai',
  rubrics: '/quan-tri/rubrics',
  rubricNew: '/quan-tri/rubrics/tao',
  rubricEdit: (id: string) => `/quan-tri/rubrics/${id}`,
  dashBlog: '/quan-tri/bai-viet',
  grade: '/quan-tri/cham-bai',
  gradeOne: (id: string) => `/quan-tri/cham-bai/${id}`,
  users: '/quan-tri/nguoi-dung',
  reports: '/quan-tri/bao-cao',
  settings: '/quan-tri/cai-dat',
  notifications: '/quan-tri/thong-bao',
  account: '/quan-tri/tai-khoan',
} as const;

type Patch = Record<string, string> | undefined;

export function routeToHref(key: string, patch?: Patch): string {
  const id = (k: string) => (patch && patch[k]) || '';
  switch (key) {
    case 'home': return ROUTES.home;
    case 's-docs': return ROUTES.library;
    case 's-doc': return ROUTES.libraryItem(id('doc'));
    case 's-tasks': return ROUTES.practice;
    case 's-task': return ROUTES.practiceItem(id('task'));
    case 's-selfcheck': return ROUTES.selfCheck;
    case 'blog': return ROUTES.blog;
    case 'article': return ROUTES.blogPost(id('article'));
    case 's-mine': return ROUTES.myLibrary;
    case 'about': return ROUTES.about;
    case 'guide': return ROUTES.guide;
    case 'contact': return ROUTES.contact;
    case 'terms': return ROUTES.terms;
    case 'a-overview': return ROUTES.dashboard;
    case 'docs': return ROUTES.dashLibrary;
    case 'bank': return ROUTES.questionBank;
    case 'bank-edit': return patch && patch.question ? `${ROUTES.questionNew}?id=${patch.question}` : ROUTES.questionNew;
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
    case 'account': return ROUTES.account;
    default: return ROUTES.home;
  }
}

export function resolvePath(pathname: string): { routeKey: string; navKey: string } {
  const seg = (pathname || '/').replace(/\/+$/, '') || '/';
  const r = (routeKey: string, navKey: string) => ({ routeKey, navKey });

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
  if (seg.startsWith('/quan-tri/tai-khoan')) return r('account', 'account');

  if (/^\/kho-hoc-lieu\/[^/]+/.test(seg)) return r('s-doc', 's-docs');
  if (seg.startsWith('/kho-hoc-lieu')) return r('s-docs', 's-docs');
  if (/^\/luyen-tap\/[^/]+/.test(seg)) return r('s-task', 's-tasks');
  if (seg.startsWith('/luyen-tap')) return r('s-tasks', 's-tasks');
  if (seg.startsWith('/tu-danh-gia')) return r('s-selfcheck', 's-selfcheck');
  if (/^\/bai-viet\/[^/]+/.test(seg)) return r('article', 'blog');
  if (seg.startsWith('/bai-viet')) return r('blog', 'blog');
  if (seg.startsWith('/cua-toi')) return r('s-mine', 's-mine');
  if (seg.startsWith('/gioi-thieu')) return r('page-about', '');
  if (seg.startsWith('/huong-dan')) return r('page-guide', '');
  if (seg.startsWith('/lien-he')) return r('page-contact', '');
  if (seg.startsWith('/dieu-khoan')) return r('page-terms', '');
  return r('home', 'home');
}
