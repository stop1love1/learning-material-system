import { test, expect } from '@playwright/test';

test('pagination page persists in URL across reload', async ({ page }) => {
  await page.goto('/luyen-tap');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.ant-pagination')).toBeVisible();
  // Quick jumper input present.
  await expect(page.locator('.ant-pagination-options-quick-jumper')).toBeVisible();

  await page.locator('.ant-pagination-item-2').click();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/[?&]page=2/);

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.ant-pagination-item-2.ant-pagination-item-active')).toBeVisible();
});

test('search keyword persists in URL across reload', async ({ page }) => {
  await page.goto('/luyen-tap');
  await page.waitForLoadState('networkidle');
  const search = page.locator('input[placeholder*="Tìm"]').first();
  await search.fill('bài');
  await page.waitForTimeout(800); // debounce (300) + fetch
  await expect(page).toHaveURL(/[?&]q=/);

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[placeholder*="Tìm"]').first()).toHaveValue('bài');
});
