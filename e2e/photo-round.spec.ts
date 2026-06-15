import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen } from './helpers/auth';

test.describe('Photo round flow', () => {
	test.setTimeout(90_000);

	test('inventory location skips zone picker on capture', async ({ page }) => {
		await page.goto('/scan?mode=photo&location=fridge&from=/inventory/fridge');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 30_000 });
		await expect(page.getByTestId('photo-round-zone-fridge')).toHaveCount(0);
	});

	test('photo mode without location skips forced zone step', async ({ page }) => {
		await page.goto('/scan?mode=photo&from=/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 30_000 });
		await expect(page.getByTestId('photo-round-lead')).toContainText(
			/AI föreslår plats|AI suggests location/i,
			{ timeout: 15_000 }
		);
		await expect(page.getByTestId('photo-round-zone-fridge')).not.toBeVisible();
		await expect(page.getByTestId('photo-round-zone-toggle')).toContainText(
			/Byt zon för analys|Change zone for analysis/i,
			{ timeout: 15_000 }
		);
		await expect(page.getByTestId('photo-round-analyze')).toBeDisabled();
	});
});
