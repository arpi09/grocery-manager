import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

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

	test('authenticated dashboard responds OK', async ({ page }) => {
		await loginAsAdmin(page);
		const response = await page.request.get('/');
		expect(response.status()).toBe(200);
		await expect(page.getByRole('heading', { name: 'Home Pantry' })).toBeVisible();
	});
});
