import { test, expect } from '@playwright/test';
import { getToken, seedAuth, seedTheme, collectConsoleErrors, realErrors } from './helpers';

const SCREENS = 'e2e/__screens__';

// Give server-paged lists / antd a moment to settle before snapping.
async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1200);
}

test.describe('screenshots (visual review of antd migration)', () => {
  test('public pages (light)', async ({ page }) => {
    const errs = collectConsoleErrors(page);

    await page.goto('/');
    await settle(page);
    await page.screenshot({ path: `${SCREENS}/home.png`, fullPage: true });

    await page.goto('/kho-hoc-lieu');
    await settle(page);
    await page.screenshot({ path: `${SCREENS}/kho-hoc-lieu.png`, fullPage: true });

    await page.goto('/luyen-tap');
    await settle(page);
    await page.screenshot({ path: `${SCREENS}/luyen-tap.png`, fullPage: true });

    await page.goto('/bai-viet');
    await settle(page);
    await page.screenshot({ path: `${SCREENS}/bai-viet-light.png`, fullPage: true });

    const e = realErrors(errs);
    console.log('[screens public light] console errors:', e.length ? e : 'none');
  });

  test('bai-viet (dark)', async ({ page }) => {
    const errs = collectConsoleErrors(page);
    await seedTheme(page, true);
    await page.goto('/bai-viet');
    await settle(page);
    await page.screenshot({ path: `${SCREENS}/bai-viet-dark.png`, fullPage: true });
    const e = realErrors(errs);
    console.log('[screens bai-viet dark] console errors:', e.length ? e : 'none');
  });

  test('admin pages (logged in)', async ({ page, request }) => {
    const errs = collectConsoleErrors(page);
    const token = await getToken(request);
    await seedAuth(page, token);

    await page.goto('/quan-tri/nguoi-dung');
    await expect(page.locator('.ant-table').first()).toBeVisible({ timeout: 20_000 });
    await settle(page);
    await page.screenshot({ path: `${SCREENS}/quan-tri-nguoi-dung.png`, fullPage: true });

    await page.goto('/quan-tri/bai-tap');
    await settle(page);
    await page.screenshot({ path: `${SCREENS}/quan-tri-bai-tap.png`, fullPage: true });

    await page.goto('/quan-tri/ngan-hang-cau-hoi');
    await settle(page);
    await page.screenshot({ path: `${SCREENS}/quan-tri-ngan-hang-cau-hoi.png`, fullPage: true });

    const e = realErrors(errs);
    console.log('[screens admin] console errors:', e.length ? e : 'none');
  });
});
