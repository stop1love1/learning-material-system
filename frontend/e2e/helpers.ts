import { Page, APIRequestContext, expect } from '@playwright/test';

export const API = 'http://localhost:3001/api';
export const ADMIN = { email: 'admin@vuonvan.vn', password: 'admin123456' };

// The frontend stores the JWT under this localStorage key (app/lib/api/client.ts).
export const TOKEN_KEY = 'lms-token';
export const THEME_KEY = 'lms-theme-v1';

/** Log in via the API and return the JWT. Source-of-truth auth for tests. */
export async function getToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: ADMIN });
  expect(res.ok(), `login failed: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  expect(body.accessToken, 'no accessToken in login response').toBeTruthy();
  return body.accessToken as string;
}

/**
 * Seed localStorage BEFORE any document loads so AuthProvider's session-restore
 * effect (which calls /auth/me when a token is present) picks it up. Optionally
 * force dark mode via the theme key.
 */
export async function seedAuth(page: Page, token: string, opts: { dark?: boolean } = {}) {
  await page.addInitScript(
    ({ tokenKey, token, themeKey, dark }) => {
      try {
        localStorage.setItem(tokenKey, token);
        if (dark) localStorage.setItem(themeKey, JSON.stringify({ dark: true }));
      } catch {}
    },
    { tokenKey: TOKEN_KEY, token, themeKey: THEME_KEY, dark: !!opts.dark },
  );
}

export async function seedTheme(page: Page, dark: boolean) {
  await page.addInitScript(
    ({ themeKey, dark }) => {
      try {
        if (dark) localStorage.setItem(themeKey, JSON.stringify({ dark: true }));
      } catch {}
    },
    { themeKey: THEME_KEY, dark },
  );
}

/** Attach a console-error collector. Returns the array (mutated as errors arrive). */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  return errors;
}

// Benign console noise we don't want to fail on (favicon/network/dev HMR/etc).
const BENIGN = [
  /favicon/i,
  /Failed to load resource/i,
  /net::ERR/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /Warning: .*deprecated/i, // antd compat deprecation warnings emitted as warn, not error
  /\[GSI_LOGGER\]/i, // Google Identity Services: dev origin not whitelisted for the client id
  /origin is not allowed for the given client/i,
];

export function realErrors(errors: string[]): string[] {
  return errors.filter((e) => !BENIGN.some((re) => re.test(e)));
}

/**
 * Read the "tổng X ..." total printed by antd Pagination (Pagination.tsx /
 * the users Table both use showTotal `tổng {n} ...`). Returns the integer X.
 */
export async function readUiTotal(page: Page): Promise<number> {
  const el = page.locator('.ant-pagination-total-text').first();
  await expect(el).toBeVisible();
  const txt = (await el.innerText()).trim();
  const m = txt.match(/tổng\s+([\d.,]+)/i);
  expect(m, `could not parse total from "${txt}"`).toBeTruthy();
  return parseInt(m![1].replace(/[.,]/g, ''), 10);
}
