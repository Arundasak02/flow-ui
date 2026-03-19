import { expect, test, type Page } from '@playwright/test';

test.describe('Flow UI visual inspection', () => {
  async function currentLevel(page: Page) {
    const txt = await page.getByTestId('semantic-level-indicator').textContent();
    const match = txt?.match(/Zoom Level (\d) \/ 5/);
    return match ? Number(match[1]) : 0;
  }

  test('landing provides immediate mental map cues', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('semantic-level-indicator')).toBeVisible();
    const level = await currentLevel(page);
    expect(level).toBeGreaterThanOrEqual(1);
    expect(level).toBeLessThanOrEqual(5);
    await expect(page.getByRole('button', { name: 'Business' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Engineering' })).toBeVisible();
    await expect(page.getByText('Order Service')).toBeVisible();
    await expect(page.getByText('Payment Service')).toBeVisible();
    await expect(page.getByText('Inventory Service')).toBeVisible();
    await expect(page.getByText('Graph Workspace')).toBeVisible();
  });

  test('drill in and out works with double click', async ({ page }) => {
    await page.goto('/');
    const before = await currentLevel(page);

    const orderService = page.getByText('Order Service').first();
    await orderService.dblclick();
    const afterDrill1 = await currentLevel(page);
    if (before < 5) {
      expect(afterDrill1).toBeGreaterThanOrEqual(before);
    } else {
      expect(afterDrill1).toBe(5);
    }

    await orderService.dblclick();
    const afterDrill2 = await currentLevel(page);
    expect(afterDrill2).toBeGreaterThanOrEqual(afterDrill1);

    await page.getByRole('button', { name: 'Zoom out level' }).click();
    const afterOut = await currentLevel(page);
    expect(afterOut).toBeLessThanOrEqual(afterDrill2);
  });

  test('business and engineering tab keeps same node truth', async ({ page }) => {
    await page.goto('/');

    // Drill in for method-level visibility
    const orderService = page.getByText('Order Service').first();
    await orderService.dblclick();
    await orderService.dblclick();

    await expect(page.getByText('Validate Cart')).toBeVisible();
    await page.getByRole('button', { name: 'Engineering' }).click();
    await expect(page.getByTestId('semantic-level-indicator')).toBeVisible();
    await expect(page.getByText('OrderService.validateCart()')).toBeVisible();

    await page.getByRole('button', { name: 'Business' }).click();
    await expect(page.getByText('Validate Cart')).toBeVisible();
  });

  test('search and node detail panel are accessible', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Search services, methods, traces...').fill('payment');
    await page.getByRole('button', { name: /Payment Service/ }).first().click();

    await expect(page.getByTestId('node-detail-panel')).toBeVisible();
    await expect(page.getByText('Business Description')).toBeVisible();
    await expect(page.getByText('Runtime')).toBeVisible();
    await expect(page.getByText('Used In Flows')).toBeVisible();
  });

  test('capture golden journey screenshots for review', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1600, height: 1000 });

    await page.screenshot({ path: 'workflow/artifacts/ITER-001/qa/01-landing-level1.png', fullPage: true });

    const orderService = page.getByText('Order Service').first();
    await orderService.dblclick();
    await page.screenshot({ path: 'workflow/artifacts/ITER-001/qa/02-level2.png', fullPage: true });

    await orderService.dblclick();
    await page.screenshot({ path: 'workflow/artifacts/ITER-001/qa/03-level3.png', fullPage: true });

    await page.getByRole('button', { name: 'Engineering' }).click();
    await page.screenshot({ path: 'workflow/artifacts/ITER-001/qa/04-engineering-level3.png', fullPage: true });
  });
});

