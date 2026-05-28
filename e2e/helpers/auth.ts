import type { Page } from '@playwright/test';

export function adminCredentials() {
	const email =
		process.env.E2E_ADMIN_EMAIL?.trim() ||
		process.env.ADMIN_EMAIL?.trim() ||
		'arvid.pilhall@me.com';
	const password =
		process.env.E2E_ADMIN_PASSWORD?.trim() || process.env.ADMIN_PASSWORD?.trim() || '';

	if (!password) {
		throw new Error(
			'Set ADMIN_PASSWORD (or E2E_ADMIN_PASSWORD) in .env so the seeded admin can sign in.'
		);
	}

	return { email, password };
}

export async function loginAsAdmin(page: Page) {
	const { email, password } = adminCredentials();

	await page.goto('/login');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 });
}

export async function openMoreNav(page: Page) {
	await page.getByRole('navigation', { name: /Prim/i }).getByRole('button', { name: 'Mer' }).click();
}

export async function clickNavHref(page: Page, href: string) {
	await page.locator(`a[href="${href}"]`).first().click();
}

export async function clickSecondaryNavHref(page: Page, href: string) {
	await openMoreNav(page);
	await page
		.locator(`#nav-more-desktop a[href="${href}"], #nav-more-sheet a[href="${href}"]`)
		.first()
		.click();
}
