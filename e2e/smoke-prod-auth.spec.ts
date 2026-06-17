import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { expectHomeSectionVisible } from './helpers/home';

function attachPageErrorGuard(page: import('@playwright/test').Page) {
	const errors: string[] = [];
	page.on('pageerror', (err) => {
		errors.push(err.message);
	});
	return () => errors;
}

test.describe('Production auth smoke', () => {
	test('login and /hem loads without client crash', async ({ page }) => {
		const collectErrors = attachPageErrorGuard(page);

		await loginAsAdmin(page);

		const response = await page.goto('/hem', { waitUntil: 'domcontentloaded' });
		expect(response?.status() ?? 0).toBeLessThan(500);

		await expectHomeSectionVisible(page);
		await expect(page.locator('body')).not.toContainText('Internal Error', { timeout: 5_000 });

		const errors = collectErrors();
		const fatal = errors.filter(
			(msg) =>
				msg.includes('process is not defined') ||
				msg.includes('guides.server') ||
				msg.includes('readFileSync')
		);
		expect(fatal, `pageerror on /hem: ${fatal.join('; ')}`).toEqual([]);
	});
});
