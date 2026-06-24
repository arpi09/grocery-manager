import { test, expect } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingSurveyIfOpen,
	loginAsAdmin
} from './helpers/auth';

test.describe('Back navigation smoke', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		await dismissOnboardingModalIfOpen(page);
		await dismissPostOnboardingSurveyIfOpen(page);
		await dismissPageHintIfOpen(page);
	});

	test('inventory merge shows back to pantry', async ({ page }) => {
		await page.goto('/inventory');
		await page.goto('/inventory/merge');
		const backLink = page.locator('[data-testid="app-header-back"]');
		await expect(backLink).toBeVisible({ timeout: 15_000 });
		await expect(backLink).toContainText(/Tillbaka till skafferiet/i);
		await backLink.click();
		await page.waitForURL(/\/inventory\/?$/, { timeout: 15_000 });
	});

	test('statistik wrapped shows back to stats', async ({ page }) => {
		await page.goto('/statistik');
		await page.goto('/statistik/wrapped');
		const backLink = page.locator('[data-testid="app-header-back"]');
		await expect(backLink).toBeVisible({ timeout: 15_000 });
		await expect(backLink).toContainText(/statistik/i);
		await backLink.click();
		await page.waitForURL(/\/statistik\/?$/, { timeout: 15_000 });
	});

	test('install-app shows back to settings', async ({ page }) => {
		await page.goto('/settings');
		await page.goto('/install-app');
		const backLink = page.locator('[data-testid="app-header-back"]');
		await expect(backLink).toBeVisible({ timeout: 15_000 });
		await backLink.click();
		await page.waitForURL(/\/settings\/?$/, { timeout: 15_000 });
	});

	test('scan hub has no header back link', async ({ page }) => {
		await page.goto('/scan');
		await expect(page.locator('.page-header .back-link')).toHaveCount(0);
	});
});
