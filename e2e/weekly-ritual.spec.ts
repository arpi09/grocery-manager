import { test, expect, type Page } from '@playwright/test';
import {
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingSurveyIfOpen,
	loginAsAdmin
} from './helpers/auth';

/** eat-first mock requires at least one inventory row (CI shards may start empty). */
async function ensureEatFirstInventory(page: Page) {
	await page.goto('/item/new?location=fridge&from=/planer/vecka');
	await page.locator('input[name="name"]').fill(`E2E Vecka ${Date.now()}`);
	const expiresOn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
	await page.locator('input[name="expiresOn"]').fill(expiresOn);
	await page.locator('form').getByRole('button', { name: /L.gg till vara/i }).click();
	await page.waitForURL((url) => !url.pathname.includes('/item/new'), { timeout: 20_000 });
}

test.describe('Weekly ritual — vecka', () => {
	test.setTimeout(60_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		await ensureEatFirstInventory(page);
		await page.goto('/planer/vecka');
		await dismissOnboardingModalIfOpen(page);
		await dismissPostOnboardingSurveyIfOpen(page);
		await dismissPageHintIfOpen(page);
	});

	test('generate shows meal suggestions with mock AI', async ({ page }) => {
		const generateBtn = page.getByRole('button', { name: /Generera veckoförslag/i });
		await expect(generateBtn).toBeVisible({ timeout: 15_000 });

		const eatFirstResponse = page.waitForResponse(
			(res) => res.url().includes('/api/eat-first') && res.request().method() === 'POST',
			{ timeout: 30_000 }
		);
		await generateBtn.click();
		const response = await eatFirstResponse;
		expect(response.ok()).toBeTruthy();
		const body = (await response.json()) as { suggestions?: Array<{ title: string }> };
		expect(body.suggestions?.length ?? 0).toBeGreaterThan(0);

		await expect(page.getByRole('heading', { name: 'E2E Testpasta', level: 3 })).toBeVisible({
			timeout: 20_000
		});
		await expect(page.getByText('Koka pastan enligt förpackningen.')).toBeVisible();
		await expect(page.getByRole('button', { name: /Godkänn veckan/i })).toBeVisible();
	});
});
