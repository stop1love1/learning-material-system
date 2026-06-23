// types.ts — shared type contracts for the Học Viện / Vườn Văn LMS port.
// The design is a faithful port of an inline-style React prototype; these types
// describe the two values threaded through every screen: the resolved color
// `Palette` and the live `Tweaks` (appearance settings).

export type AccentKey = 'grass' | 'sky' | 'coral' | 'amber' | 'grape' | 'custom';
export type HeadingFont = 'baloo' | 'jakarta' | 'sora' | 'system';
export type Density = 'compact' | 'regular';
export type AssignFlow = 'wizard' | 'single';
export type RubricStyle = 'matrix' | 'cards';
export type Role = 'user' | 'admin';

/** Live appearance settings (persisted to localStorage, edited via the Tweaks panel). */
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

/** Resolved color tokens for the current light/dark + accent combination. */
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
}

/** Auth state passed into the public site + gated student screens. */
export interface Auth {
  loggedIn: boolean;
  name: string;
  initials: string;
  open: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

/** Navigation context shared between screens (selected class / assignment / etc). */
export interface Ctx {
  class: string;
  assignment: string;
  rubric: string;
  task: string;
  [key: string]: string;
}

/** Props every routed screen receives from <App/>. */
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
