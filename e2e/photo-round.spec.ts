import { test, expect } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

const FIXTURE_JPEG = {
	name: 'e2e-photo-round.jpg',
	mimeType: 'image/jpeg',
	buffer: Buffer.from(
		'/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
		'base64'
	)
};

test.describe('Photo round flow', () => {
	test.setTimeout(90_000);

	test('bulk add selected items redirects with success feedback', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/scan?mode=photo&from=/hem');
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByTestId('photo-round-zone-fridge')).toBeVisible({ timeout: 15_000 });
		await dismissOnboardingModalIfOpen(page);
		await page.getByTestId('photo-round-zone-fridge').click();
		await expect(page.getByTestId('photo-round-capture')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('photo-round-analyze')).toBeVisible({ timeout: 15_000 });

		const fileInput = page.getByTestId('receipt-file-input');
		await expect(fileInput).toBeAttached({ timeout: 15_000 });
		const parseDone = page.waitForResponse(
			(res) => res.url().includes('/api/inventory/photo-scan') && res.request().method() === 'POST',
			{ timeout: 25_000 }
		);
		await fileInput.setInputFiles(FIXTURE_JPEG);
		await fileInput.evaluate((el: HTMLInputElement) => {
			el.dispatchEvent(new Event('change', { bubbles: true }));
		});
		await expect(page.getByTestId('photo-round-thumbnails')).toBeVisible({ timeout: 10_000 });

		await page.getByTestId('photo-round-analyze').click();

		const parseResponse = await parseDone;
		expect(parseResponse.ok()).toBe(true);

		await expect(page.getByTestId('photo-round-review')).toBeVisible({ timeout: 15_000 });
		await expect(page.getByTestId('photo-round-line-0')).toBeVisible();

		const bulkDone = page.waitForResponse(
			(res) =>
				res.url().includes('/scan') &&
				res.request().method() === 'POST' &&
				res.request().postData()?.includes('bulkFlow=photo'),
			{ timeout: 25_000 }
		);
		await page.getByTestId('photo-round-submit').click();
		const bulkResponse = await bulkDone;
		expect(bulkResponse.status(), await bulkResponse.text()).toBeLessThan(400);

		await expect(page).toHaveURL(/\/hem/, { timeout: 15_000 });
		await expect(
			page.locator('.toast-message').filter({ hasText: /Mjölk|varor/i })
		).toBeVisible({ timeout: 10_000 });
	});
});
