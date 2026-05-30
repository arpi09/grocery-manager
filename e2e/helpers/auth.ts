import { expect, type Page } from '@playwright/test';

const ONBOARDING_VERSION_KEY = 'home-pantry-onboarding-version';
const ONBOARDING_DISMISSED_KEY = 'home-pantry-onboarding-dismissed';
const ONBOARDING_VERSION = '1';

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

async function prepareOnboardingDismissed(page: Page) {
	await page.addInitScript(
		({ versionKey, dismissedKey, version }) => {
			localStorage.setItem(versionKey, version);
			localStorage.setItem(dismissedKey, '1');
		},
		{
			versionKey: ONBOARDING_VERSION_KEY,
			dismissedKey: ONBOARDING_DISMISSED_KEY,
			version: ONBOARDING_VERSION
		}
	);
}

async function dismissOnboardingModalIfOpen(page: Page) {
	const skip = page.getByRole('button', { name: 'Hoppa över' });
	if (await skip.isVisible().catch(() => false)) {
		await skip.click();
		await expect(skip).toBeHidden({ timeout: 5_000 });
	}
}

export async function loginAsAdmin(page: Page) {
	const { email, password } = adminCredentials();

	await prepareOnboardingDismissed(page);

	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Logga in' })).toBeVisible();

	const emailInput = page.locator('input[name="email"]');
	const passwordInput = page.locator('input[name="password"]');

	await emailInput.click();
	await emailInput.fill(email);
	await expect(emailInput).toHaveValue(email);

	await passwordInput.click();
	await passwordInput.fill(password);
	await expect(passwordInput).toHaveValue(password);

	await page.getByRole('button', { name: 'Logga in' }).click();

	await expect(page.getByRole('heading', { name: 'Hem' })).toBeVisible({ timeout: 20_000 });
	await dismissOnboardingModalIfOpen(page);
}

export async function openMoreNav(page: Page) {
	await page.getByRole('navigation', { name: /Prim/i }).getByRole('button', { name: 'Mer' }).click();
}

export async function clickNavHref(page: Page, href: string) {
	await dismissOnboardingModalIfOpen(page);
	const nav = page.getByRole('navigation', { name: /Prim/i });
	await nav.locator(`a[href="${href}"]`).click();
}

export async function clickSecondaryNavHref(page: Page, href: string) {
	await openMoreNav(page);
	await page
		.locator(`#nav-more-desktop a[href="${href}"], #nav-more-sheet a[href="${href}"]`)
		.first()
		.click();
}
