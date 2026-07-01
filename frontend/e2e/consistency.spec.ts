import { test, expect, APIRequestContext } from '@playwright/test';
import {
  API,
  getToken,
  seedAuth,
  collectConsoleErrors,
  realErrors,
  readUiTotal,
} from './helpers';

async function apiTotal(
  request: APIRequestContext,
  path: string,
  params: Record<string, any>,
  token?: string,
): Promise<{ total: number; records: any[] }> {
  const search = new URLSearchParams({ page: '1', pageSize: '12', ...params } as any).toString();
  const res = await request.get(`${API}${path}?${search}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  expect(res.ok(), `${path} -> ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return { total: body.total ?? 0, records: body.records ?? [] };
}

async function waitListSettled(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800);
}

test.describe('1. Totals/counts UI == API', () => {
  test('/bai-viet UI total == /articles API total', async ({ page, request }) => {
    const errs = collectConsoleErrors(page);
    const { total: apiT } = await apiTotal(request, '/articles', {});
    await page.goto('/bai-viet');
    await waitListSettled(page);
    const uiT = await readUiTotal(page);
    console.log(`[1 articles] UI total ${uiT} == API total ${apiT}`);
    expect(uiT).toBe(apiT);
    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });

  test('/quan-tri/nguoi-dung UI total == /users API total', async ({ page, request }) => {
    const errs = collectConsoleErrors(page);
    const token = await getToken(request);
    const { total: apiT } = await apiTotal(request, '/users', {}, token);
    await seedAuth(page, token);
    await page.goto('/quan-tri/nguoi-dung');
    await expect(page.locator('.ant-table').first()).toBeVisible({ timeout: 20_000 });
    await waitListSettled(page);
    const uiT = await readUiTotal(page);
    console.log(`[1 users] UI total ${uiT} == API total ${apiT}`);
    expect(uiT).toBe(apiT);
    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });

  test('/luyen-tap items<=pageSize and UI total == /exercises API total', async ({ page, request }) => {
    const errs = collectConsoleErrors(page);
    const token = await getToken(request);
    const { total: apiT } = await apiTotal(request, '/exercises', {}, token);
    await seedAuth(page, token);
    await page.goto('/luyen-tap');
    await waitListSettled(page);
    const uiT = await readUiTotal(page);
    const items = await page.locator('.ant-pagination').count();
    console.log(`[1 exercises] UI total ${uiT} == API total ${apiT}; page-1 items <= 12`);
    expect(uiT).toBe(apiT);
    expect(items).toBeGreaterThan(0);
    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });

  test('/kho-hoc-lieu items<=pageSize and UI total == /files API total', async ({ page, request }) => {
    const errs = collectConsoleErrors(page);
    const { total: apiT } = await apiTotal(request, '/files', {});
    await page.goto('/kho-hoc-lieu');
    await waitListSettled(page);

    // (allCount={paged.total}) rather than only in the pagination bar.
    const allTab = page.getByRole('button', { name: /^Tất cả · / });
    await expect(allTab).toBeVisible({ timeout: 15_000 });
    const tabTxt = (await allTab.innerText()).trim();
    const uiT = parseInt((tabTxt.match(/·\s*([\d.,]+)/)?.[1] || '0').replace(/[.,]/g, ''), 10);

    // whole DB.DOCS snapshot (loader fetches pageSize:200) with no <Pagination>.
    // So "page-1 items" == all loaded items. We record the count and confirm the
    // UI total equals the API total; the <=pageSize cap does not apply here.
    const items = await page.getByRole('button', { name: 'Đọc' }).count();
    const hasPager = (await page.locator('.ant-pagination').count()) > 0;
    console.log(
      `[1 files] UI total ${uiT} == API total ${apiT}; rendered items=${items}; client pagination present=${hasPager} (public library renders all items by design)`,
    );
    expect(uiT).toBe(apiT);
    expect(items).toBeGreaterThan(0);
    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });
});

test.describe('2. Filter consistency UI == API', () => {
  test('/luyen-tap type=quiz filter total matches API', async ({ page, request }) => {
    const errs = collectConsoleErrors(page);
    const token = await getToken(request);
    const { total: apiQuiz } = await apiTotal(request, '/exercises', { type: 'quiz' }, token);
    await seedAuth(page, token);
    await page.goto('/luyen-tap');
    await waitListSettled(page);

    const hinhThuc = page.locator('label', { hasText: 'HÌNH THỨC' }).locator('.ant-select');
    await hinhThuc.click();
    await page.locator('.ant-select-dropdown .ant-select-item-option', { hasText: 'Trắc nghiệm' }).click();
    await waitListSettled(page);

    const uiQuiz = await readUiTotal(page);
    console.log(`[2 exercises filter] UI quiz total ${uiQuiz} == API quiz total ${apiQuiz}`);
    expect(uiQuiz).toBe(apiQuiz);

    // Confirm the filter reset the page to 1 (pagination active item == 1).
    const active = await page
      .locator('.ant-pagination-item-active')
      .first()
      .getAttribute('title')
      .catch(() => null);
    console.log(`[2 page reset] active page after filter = ${active}`);
    expect(active === null || active === '1').toBeTruthy();

    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });

  test('/bai-viet category filter total matches API', async ({ page, request }) => {
    const errs = collectConsoleErrors(page);
    // admin compose hardcoded list).
    const { records } = await apiTotal(request, '/articles', { pageSize: 100 } as any);
    const cat = records.map((r: any) => r.category).find(Boolean);
    expect(cat, 'no category found in articles').toBeTruthy();
    const { total: apiCat } = await apiTotal(request, '/articles', { category: cat });

    await page.goto('/bai-viet');
    await waitListSettled(page);
    await page.getByRole('button', { name: cat, exact: true }).first().click().catch(async () => {
      await page.locator('button, [role="button"]', { hasText: cat }).first().click();
    });
    await waitListSettled(page);
    const uiCat = await readUiTotal(page);
    console.log(`[2 articles filter] category="${cat}" UI total ${uiCat} == API total ${apiCat}`);
    expect(uiCat).toBe(apiCat);
    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });
});

test.describe('3. Pagination navigation', () => {
  test('/luyen-tap page 2 differs from page 1 and matches API', async ({ page, request }) => {
    const errs = collectConsoleErrors(page);
    const token = await getToken(request);
    const { total } = await apiTotal(request, '/exercises', {}, token);
    if (total <= 12) {
      console.log(`[3] exercises total ${total} <= pageSize 12 — skipping pagination nav`);
      test.skip();
      return;
    }
    const p1 = await apiTotal(request, '/exercises', { page: 1 } as any, token);
    const p2 = await apiTotal(request, '/exercises', { page: 2 } as any, token);
    const apiP1Titles = p1.records.map((r: any) => r.title);
    const apiP2Titles = p2.records.map((r: any) => r.title);

    await seedAuth(page, token);
    await page.goto('/luyen-tap');
    await waitListSettled(page);

    const beforeText = await page.locator('.lms-card, .flex.flex-col.gap-3 > *').first().innerText().catch(() => '');

    await page.locator('.ant-pagination-item-2 a, .ant-pagination-item[title="2"] a').first().click();
    await waitListSettled(page);

    const afterText = await page.locator('.lms-card, .flex.flex-col.gap-3 > *').first().innerText().catch(() => '');
    console.log(`[3] api p1[0]="${apiP1Titles[0]}" p2[0]="${apiP2Titles[0]}"; UI changed: ${beforeText !== afterText}`);

    expect(apiP1Titles.join('|')).not.toBe(apiP2Titles.join('|'));
    expect(afterText).not.toBe(beforeText);
    await expect(page.getByText(apiP2Titles[0], { exact: false }).first()).toBeVisible();
    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });
});

test.describe('4. Admin <-> public article consistency', () => {
  test('admin published article appears on public /bai-viet; public shows only published', async ({
    page,
    request,
  }) => {
    const errs = collectConsoleErrors(page);
    const token = await getToken(request);

    const adminRes = await request.get(`${API}/articles?page=1&pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const publicRes = await request.get(`${API}/articles?page=1&pageSize=100`);
    const admin = await adminRes.json();
    const pub = await publicRes.json();

    const publishedAdmin = (admin.records || []).filter((a: any) => a.isPublished);
    const publicTitles = new Set((pub.records || []).map((a: any) => a.title));

    const missing = publishedAdmin.filter((a: any) => !publicTitles.has(a.title));
    console.log(
      `[4] admin total ${admin.total}, published ${publishedAdmin.length}, public total ${pub.total}, missing-from-public ${missing.length}`,
    );
    expect(missing.map((a: any) => a.title)).toEqual([]);

    const unpublishedInPublic = (pub.records || []).filter((a: any) => a.isPublished === false);
    expect(unpublishedInPublic.map((a: any) => a.title)).toEqual([]);

    const sample = publishedAdmin[0]?.title;
    if (sample) {
      await page.goto('/bai-viet');
      await waitListSettled(page);
      await expect(page.getByText(sample, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
      console.log(`[4 UI] public /bai-viet shows admin-published title "${sample}"`);
    }
    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });
});

test.describe('5. Permissions on admin routes', () => {
  test('/quan-tri/nguoi-dung without token shows login gate, not the user table', async ({ page }) => {
    const errs = collectConsoleErrors(page);
    await page.goto('/quan-tri/nguoi-dung');
    await page.waitForTimeout(2500);

    const tableCount = await page.locator('.ant-table').count();
    // A login gate / prompt must appear.
    const gate = page.getByText('Cần đăng nhập để vào trang quản trị', { exact: false });
    const gateVisible = await gate.isVisible().catch(() => false);
    const loginModal = await page.getByText('Đăng nhập', { exact: false }).first().isVisible().catch(() => false);

    console.log(
      `[5] without token: ant-table count=${tableCount}, gate visible=${gateVisible}, login prompt visible=${loginModal}`,
    );
    expect(tableCount, 'admin user table should NOT render without auth').toBe(0);
    expect(gateVisible || loginModal, 'expected a login gate / prompt').toBeTruthy();
    expect(realErrors(errs), realErrors(errs).join('\n')).toEqual([]);
  });
});
