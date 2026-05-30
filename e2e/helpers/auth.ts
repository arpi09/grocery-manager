import { expect, type Page } from '@playwright/test';
import { LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY } from '../../src/lib/i18n/locale';

const ONBOARDING_VERSION_KEY = 'home-pantry-onboarding-version';
const ONBOARDING_DISMISSED_KEY = 'home-pantry-onboarding-dismissed';
const ONBOARDING_VERSION = '1';
const E2E_LOCALE = 'sv';

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

export async function prepareE2eBrowserState(page: Page) {
	const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

	await page.context().addCookies([
		{
			name: LOCALE_COOKIE_NAME,
			value: E2E_LOCALE,
			url: baseURL
		}
	]);

	await page.addInitScript(
		({ versionKey, dismissedKey, version, localeStorageKey, localeCookieName, locale }) => {
			localStorage.setItem(versionKey, version);
			localStorage.setItem(dismissedKey, '1');
			localStorage.setItem(localeStorageKey, locale);
			document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
		},
		{
			versionKey: ONBOARDING_VERSION_KEY,
			dismissedKey: ONBOARDING_DISMISSED_KEY,
			version: ONBOARDING_VERSION,
			localeStorageKey: LOCALE_STORAGE_KEY,
			localeCookieName: LOCALE_COOKIE_NAME,
			locale: E2E_LOCALE
		}
	);

}

async function fillBoundInput(input: import('@playwright/test').Locator, value: string) {
	await input.click();
	await input.fill(value);

	if ((await input.inputValue()) !== value) {
		await input.evaluate((element, nextValue) => {
			const field = element as HTMLInputElement;
			field.value = nextValue;
			field.dispatchEvent(new Event('input', { bubbles: true }));
			field.dispatchEvent(new Event('change', { bubbles: true }));
		}, value);
	}

	await expect(input).toHaveValue(value);
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

	await prepareE2eBrowserState(page);

	await page.goto('/login');
	await page.waitForLoadState('networkidle');
	await expect(page.getByTestId('login-submit')).toBeVisible();

	const emailInput = page.locator('input[name="email"]');
	const passwordInput = page.locator('input[name="password"]');

	await fillBoundInput(emailInput, email);
	await fillBoundInput(passwordInput, password);

	await Promise.all([
		page.waitForURL((url) => url.pathname !== '/login', { timeout: 20_000 }),
		page.getByTestId('login-submit').click()
	]);

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
