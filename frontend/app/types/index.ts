export type AccentKey = 'grass' | 'sky' | 'coral' | 'amber' | 'grape' | 'custom';
export type HeadingFont = 'baloo' | 'jakarta' | 'sora' | 'system';
export type Density = 'compact' | 'regular';
export type AssignFlow = 'wizard' | 'single';
export type RubricStyle = 'matrix' | 'cards';
export type Role = 'student' | 'teacher' | 'admin';

export interface Tweaks {
  accent: AccentKey | string;
  accentHex: string;
  headingFont: HeadingFont;
  density: Density;
  railWide: boolean;
  dark: boolean;
  assignFlow: AssignFlow;
  rubricStyle: RubricStyle;
  [key: string]: unknown;
}

export interface Palette {
  dark: boolean;
  bg: string;
  surface: string;
  raise: string;
  sink: string;
  ink: string;
  sub: string;
  faint: string;
  line: string;
  lineSoft: string;
  accent: string;
  accentSoft: string;
  railBg: string;
  activeBg: string;
  ok: string;
  warn: string;
  danger: string;
  info: string;
  glow: string;
  shadow: string;
  contrastBg: string;
  contrastText: string;
  contrastBorder: string;
}

export interface Auth {
  loggedIn: boolean;
  ready: boolean; // true sau khi khôi phục phiên (tránh nháy gate khi đang xác thực)
  name: string;
  email: string; // '' khi chưa đăng nhập
  initials: string;
  role: Role | ''; // '' khi chưa đăng nhập
  isStaff: boolean; // true khi role là 'teacher' hoặc 'admin'
  open: () => void;
  login: (email: string, password: string) => Promise<{ needs2fa?: boolean; email?: string; devOtp?: string }>;
  verify2fa: (email: string, code: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ needsVerification?: boolean; devVerifyLink?: string }>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
}

export interface Ctx {
  assignment: string;
  rubric: string;
  task: string;
  [key: string]: string;
}

export interface ScreenProps {
  p: Palette;
  t: Tweaks;
  ctx?: Ctx;
  setRoute: (route: string) => void;
  go?: (route: string, patch?: Partial<Ctx>) => void;
  auth?: Auth;
  setTweak?: (key: string | Partial<Tweaks>, value?: unknown) => void;
  resetTheme?: () => void;
  themeDefaults?: Tweaks;
}
