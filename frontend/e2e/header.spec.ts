import { test, expect } from '@playwright/test';
import { getToken, seedAuth, collectConsoleErrors, realErrors } from './helpers';

test.describe('header: admin-link gating + avatar profile popup', () => {
  test('guest: admin entry hidden, login button shown', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/bai-viet');
    await page.waitForLoadState('networkidle');
    // The admin entry button is titled "Khu vực quản trị" — must NOT exist for guests.
    await expect(page.locator('[title="Khu vực quản trị"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
    await page.screenshot({ path: 'e2e/__screens__/header-guest.png' });
    expect(realErrors(errors), `console errors: ${realErrors(errors).join('\n')}`).toEqual([]);
  });

  test('admin: avatar opens profile popup (name/email/role + admin link)', async ({ page, request }) => {
    const errors = collectConsoleErrors(page);
    const token = await getToken(request);
    await seedAuth(page, token);
    await page.goto('/bai-viet');
    await page.waitForLoadState('networkidle');
    // Admin entry visible for staff.
    await expect(page.locator('[title="Khu vực quản trị"]')).toBeVisible();
    // Click the avatar (the account button) to open the popup.
    await page.locator('button[aria-label="Tài khoản"]').click();
    const pop = page.locator('.ant-popover');
    await expect(pop).toBeVisible();
    await expect(pop.getByText('admin@vuonvan.vn')).toBeVisible(); // email (unique)
    await expect(pop.getByText('Quản trị viên')).toHaveCount(2); // display name + role tag
    await expect(pop.getByText('Khu vực quản trị')).toBeVisible();
    await expect(pop.getByText('Đăng xuất')).toBeVisible();
    await page.screenshot({ path: 'e2e/__screens__/header-admin-popup.png' });
    expect(realErrors(errors), `console errors: ${realErrors(errors).join('\n')}`).toEqual([]);
  });
});
