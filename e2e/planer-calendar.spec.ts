import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Planer calendar week navigation', () => {
	test.setTimeout(60_000);
	test.use({ viewport: { width: 390, height: 844 } });

	test('week prev/next updates URL and visible range @deploy-critical', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/planer?week=2026-06-01', { waitUntil: 'commit', timeout: 60_000 });
		await dismissOnboardingModalIfOpen(page);

		const weekRange = page.getByTestId('ata-calendar-week-range');
		await expect(weekRange).toBeVisible({ timeout: 15_000 });
		const initialRange = (await weekRange.textContent())?.trim() ?? '';
		expect(initialRange.length).toBeGreaterThan(0);

		await page.getByTestId('ata-calendar-next-week').click();
		await expect(page).toHaveURL(/[?&]week=2026-06-08/);
		await expect(weekRange).not.toHaveText(initialRange);

		const afterNext = (await weekRange.textContent())?.trim() ?? '';
		await page.getByTestId('ata-calendar-prev-week').click();
		await expect(page).toHaveURL(/[?&]week=2026-06-01/);
		await expect(weekRange).toHaveText(initialRange);
		expect(afterNext).not.toBe(initialRange);
	});

	test('week navigation preserves scroll position', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/planer?week=2026-06-01', { waitUntil: 'commit', timeout: 60_000 });
		await dismissOnboardingModalIfOpen(page);

		await page.evaluate(() => window.scrollTo(0, 420));
		const scrollBefore = await page.evaluate(() => window.scrollY);
		expect(scrollBefore).toBeGreaterThan(200);

		await page.getByTestId('ata-calendar-next-week').click();
		await expect(page).toHaveURL(/[?&]week=2026-06-08/);

		await expect
			.poll(async () => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(scrollBefore - 24);
		await expect
			.poll(async () => page.evaluate(() => window.scrollY))
			.toBeLessThan(scrollBefore + 24);
	});

	test('today link resets week to current week', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/planer?week=2026-01-05', { waitUntil: 'commit', timeout: 60_000 });
		await dismissOnboardingModalIfOpen(page);

		await page.getByTestId('ata-calendar-today').click();
		await expect(page).toHaveURL(/[?&]week=/);
		await expect(page).not.toHaveURL(/week=2026-01-05/);
	});
});
