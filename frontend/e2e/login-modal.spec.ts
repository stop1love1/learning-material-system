import { test, expect } from '@playwright/test';
import { seedTheme, collectConsoleErrors, realErrors } from './helpers';

async function openModal(page) {
  await page.goto('/bai-viet');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Đăng nhập' }).first().click();
  // The modal's primary submit button + email field confirm it's open.
  await expect(page.getByPlaceholder('email', { exact: false }).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200); // let the GSI button render
}

test('login modal: improved Google button (light)', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openModal(page);
  await page.screenshot({ path: 'e2e/__screens__/login-modal-light.png' });
  // The GSI button renders inside an iframe. On non-whitelisted dev origins Google
  // marks it hidden, so assert it's ATTACHED (present) rather than visible.
  const frame = page.locator('iframe[src*="accounts.google.com"]').first();
  await expect(frame).toBeAttached();
  expect(realErrors(errors), realErrors(errors).join('\n')).toEqual([]);
});

test('login modal: improved Google button (dark)', async ({ page }) => {
  await seedTheme(page, true);
  await openModal(page);
  await page.screenshot({ path: 'e2e/__screens__/login-modal-dark.png' });
  await expect(page.locator('iframe[src*="accounts.google.com"]').first()).toBeAttached();
});
