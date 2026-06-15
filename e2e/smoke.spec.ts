import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

const MARKETING_PATHS = ['/', '/guider/minska-matsvinn-hemma-app'] as const;

function attachPageErrorGuard(page: import('@playwright/test').Page) {
	const errors: string[] = [];
	page.on('pageerror', (err) => {
		errors.push(err.message);
	});
	return () => errors;
}

test.describe('Marketing hydration', () => {
	for (const path of MARKETING_PATHS) {
		test(`no client crash on ${path} @deploy-critical`, async ({ page }) => {
			const collectErrors = attachPageErrorGuard(page);
			const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
			expect(response?.status() ?? 0).toBeLessThan(500);

			await expect(page.locator('body')).not.toContainText('Internal Error', { timeout: 5_000 });

			const errors = collectErrors();
			const fatal = errors.filter(
				(msg) =>
					msg.includes('process is not defined') ||
					msg.includes('guides.server') ||
					msg.includes('readFileSync')
			);
			expect(fatal, `pageerror on ${path}: ${fatal.join('; ')}`).toEqual([]);
		});
	}
});

test.describe('Smoke', () => {
	test('unauthenticated GET / is not a server error', async ({ request }) => {
		const response = await request.get('/', { maxRedirects: 0 });
		expect(response.status()).toBeLessThan(500);
		expect([200, 302, 303, 307, 308]).toContain(response.status());
	});

	test('login page responds OK', async ({ request }) => {
		const response = await request.get('/login');
		expect(response.status()).toBe(200);
	});

	test('register page responds OK', async ({ request }) => {
		const response = await request.get('/register');
		expect(response.status()).toBe(200);
	});

	test('authenticated dashboard responds OK', async ({ page }) => {
		await loginAsAdmin(page);
		const response = await page.request.get('/');
		expect(response.status()).toBe(200);
	});
});