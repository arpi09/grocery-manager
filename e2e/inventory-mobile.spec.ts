import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Inventory mobile UX', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('compact list shows log usage button', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);

		const list = page.getByTestId('inventory-compact-list');
		if (!(await list.isVisible({ timeout: 15_000 }).catch(() => false))) {
			test.skip(true, 'No inventory rows in fridge — list hidden behind empty state');
		}

		const logUsage = list.getByRole('button', { name: /Logga förbrukning|Log usage/i }).first();
		await expect(logUsage).toBeVisible();
		await expect(logUsage).toBeInViewport();
	});

	test('log sheet stays open while scrolling the list', async ({ page }) => {
		test.setTimeout(60_000);
		await loginAsAdmin(page);
		await page.goto('/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);

		const list = page.getByTestId('inventory-compact-list');
		if (!(await list.isVisible({ timeout: 15_000 }).catch(() => false))) {
			test.skip(true, 'No inventory rows in fridge — list hidden behind empty state');
		}

		const logUsage = list.getByRole('button', { name: /Logga förbrukning|Log usage/i }).first();
		await logUsage.click();

		const sheet = page.getByTestId('inventory-consume-sheet');
		await expect(sheet).toBeVisible({ timeout: 5_000 });

		await page.evaluate(() => window.scrollBy(0, 500));
		await page.waitForTimeout(300);

		await expect(sheet).toBeVisible();
		await expect(sheet.getByRole('button', { name: /Logga förbrukning|Log usage|Confirm/i })).toBeVisible();
	});
});
