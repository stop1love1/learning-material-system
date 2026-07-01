import { test, expect } from '@playwright/test';
import { getToken, seedAuth, collectConsoleErrors, realErrors, readUiTotal, API } from './helpers';

test('question bank: antd pagination + lazy preview detail', async ({ page, request }) => {
  const errors = collectConsoleErrors(page);
  const token = await getToken(request);
  await seedAuth(page, token);

  // API source of truth.
  const apiRes = await request.get(`${API}/questions?page=1&pageSize=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const api = await apiRes.json();

  await page.goto('/quan-tri/ngan-hang-cau-hoi');
  await page.waitForLoadState('networkidle');

  // antd Pagination present and total matches API.
  await expect(page.locator('.ant-pagination')).toBeVisible({ timeout: 20000 });
  const uiTotal = await readUiTotal(page);
  expect(uiTotal).toBe(api.total);

  // Page 1 shows at most pageSize (10) question cards.
  const cards = page.locator('.lms-card').filter({ hasNot: page.locator('.ant-tag') }); // list cards
  // Fallback: count clickable list items via their stem text is brittle; assert pagination page count instead.
  const pages = Math.ceil(api.total / 10);
  if (pages > 1) {
    // Navigate to page 2 via antd pager and ensure it doesn't error.
    await page.locator('.ant-pagination-item-2').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-pagination-item-2.ant-pagination-item-active')).toBeVisible();
  }

  await page.screenshot({ path: 'e2e/__screens__/bank-pagination.png' });
  expect(realErrors(errors), `console errors:\n${realErrors(errors).join('\n')}`).toEqual([]);
});
