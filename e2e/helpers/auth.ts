import { expect, type Page } from '@playwright/test';
import { LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY } from '../../src/lib/i18n/locale';

const ONBOARDING_VERSION_KEY = 'home-pantry-onboarding-version';
const ONBOARDING_DISMISSED_KEY = 'home-pantry-onboarding-dismissed';
const ACTIVATION_RECEIPT_KEY = 'home-pantry-activation-receipt-done';
const CELEBRATION_PENDING_KEY = 'home-pantry-celebration-pending';
const ONBOARDING_VERSION = '1';
const E2E_LOCALE = 'sv';

/** Must stay below Playwright test timeout (see playwright.config / per-spec setTimeout). */
export const E2E_AUTH_NAV_TIMEOUT_MS = 45_000;

function pickEnv(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export function adminCredentials() {
	const email =
		pickEnv(process.env.E2E_ADMIN_EMAIL) ?? pickEnv(process.env.ADMIN_EMAIL) ?? 'e2e-admin@example.com';
	const password =
		pickEnv(process.env.E2E_ADMIN_PASSWORD) ?? pickEnv(process.env.ADMIN_PASSWORD) ?? 'e2e-ci-password';

	if (!password) {
		throw new Error(
			'Set ADMIN_PASSWORD (or E2E_ADMIN_PASSWORD) in .env so the seeded admin can sign in.'
		);
	}

	return { email, password };
}

export function uniqueE2eEmail(prefix = 'e2e-user') {
	const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	return `${prefix}-${stamp}@example.com`;
}

export function e2eUserPassword() {
	return process.env.E2E_USER_PASSWORD?.trim() || 'e2e-test-password-9';
}

async function applyE2eLocale(page: Page) {
	const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

	await page.context().addCookies([
		{
			name: LOCALE_COOKIE_NAME,
			value: E2E_LOCALE,
			url: baseURL
		}
	]);

	await page.addInitScript(
		({ localeStorageKey, localeCookieName, locale }) => {
			localStorage.setItem(localeStorageKey, locale);
			document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
		},
		{
			localeStorageKey: LOCALE_STORAGE_KEY,
			localeCookieName: LOCALE_COOKIE_NAME,
			locale: E2E_LOCALE
		}
	);
}

/** Locale only ? onboarding and activation state stay fresh (new-user flows). */
export async function prepareFreshUserBrowserState(page: Page) {
	await applyE2eLocale(page);

	await page.addInitScript(() => {
		for (const key of [
			'home-pantry-onboarding-version',
			'home-pantry-onboarding-dismissed',
			'home-pantry-activation-path',
			'home-pantry-activation-barcode-count',
			'home-pantry-activation-receipt-done',
			'home-pantry-celebration-pending',
			'home-pantry-post-onboarding-survey-pending',
			'home-pantry-post-onboarding-survey-dismissed'
		]) {
			localStorage.removeItem(key);
		}
	});
}

export async function prepareE2eBrowserState(page: Page) {
	await applyE2eLocale(page);

	await page.addInitScript(
		({ versionKey, dismissedKey, version, activationReceiptKey, celebrationKey }) => {
			localStorage.setItem(versionKey, version);
			localStorage.setItem(dismissedKey, '1');
			localStorage.setItem(activationReceiptKey, '1');
			localStorage.removeItem(celebrationKey);
		},
		{
			versionKey: ONBOARDING_VERSION_KEY,
			dismissedKey: ONBOARDING_DISMISSED_KEY,
			version: ONBOARDING_VERSION,
			activationReceiptKey: ACTIVATION_RECEIPT_KEY,
			celebrationKey: CELEBRATION_PENDING_KEY
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

export async function dismissCookieConsentIfOpen(page: Page) {
	const dialog = page.locator('[aria-labelledby="cookie-consent-title"]');
	if (await dialog.isVisible().catch(() => false)) {
		await page.getByRole("button", { name: /Endast n.dv.ndiga|Godk.nn/i }).first().click();
		await dialog.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
	}
}

export async function dismissOnboardingModalIfOpen(page: Page) {
	await dismissCookieConsentIfOpen(page);
	const skip = page.getByRole('button', { name: /Jag gör det senare|Hoppa|senare/i });
	if (await skip.isVisible().catch(() => false)) {
		await skip.click();
		await expect(skip).toBeHidden({ timeout: 5_000 });
	}
}

async function waitForAppHome(page: Page) {
	await page.waitForURL((url) => url.pathname === '/hem', {
		timeout: E2E_AUTH_NAV_TIMEOUT_MS,
		waitUntil: 'commit'
	});
	await expect(page.locator('section.home')).toBeVisible({ timeout: 20_000 });
}

export async function expectOnboardingGuideVisible(page: Page) {
	await expect(
		page.getByRole('heading', { name: /V\u00e4lkommen till Skaffu/i })
	).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole('button', { name: /Jag g\u00f6r det senare/i })).toBeVisible();
}

export async function registerNewUser(
	page: Page,
	options: { email?: string; password?: string } = {}
) {
	const email = options.email ?? uniqueE2eEmail();
	const password = options.password ?? e2eUserPassword();

	await prepareFreshUserBrowserState(page);

	await page.goto('/register');
	await expect(page.getByTestId('register-submit')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('register-turnstile')).toHaveCount(0);

	const passwordInput = page.locator('input[name="password"]');
	const confirmInput = page.locator('input[name="confirmPassword"]');
	const emailInput = page.locator('input[name="email"]');

	await fillBoundInput(emailInput, email);
	await fillBoundInput(passwordInput, password);
	await fillBoundInput(confirmInput, password);

	const navigatedHome = waitForAppHome(page);
	await page.getByTestId('register-submit').click();
	await navigatedHome;

	await expect(page.locator('section.home')).toBeVisible({ timeout: 20_000 });

	return { email, password };
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
	await prepareE2eBrowserState(page);

	await page.goto('/login');
	await expect(page.getByTestId('login-submit')).toBeVisible({ timeout: 15_000 });

	const emailInput = page.locator('input[name="email"]');
	const passwordInput = page.locator('input[name="password"]');

	await fillBoundInput(emailInput, email);
	await fillBoundInput(passwordInput, password);

	await dismissCookieConsentIfOpen(page);

	const loginActionDone = page.waitForResponse(
		(res) =>
			res.request().method() === 'POST' &&
			res.url().includes('/login') &&
			res.status() < 500,
		{ timeout: E2E_AUTH_NAV_TIMEOUT_MS }
	);
	const navigatedHome = waitForAppHome(page);
	await page.getByTestId('login-submit').click();
	await loginActionDone;

	try {
		await navigatedHome;
	} catch (error) {
		const loginError = page.getByRole('alert');
		if (await loginError.isVisible().catch(() => false)) {
			throw new Error(`Login failed: ${(await loginError.textContent())?.trim() ?? 'unknown error'}`, {
				cause: error
			});
		}
		throw error;
	}

	await expect(page.locator('section.home')).toBeVisible({ timeout: 20_000 });
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
	const { email, password } = adminCredentials();
	await loginWithCredentials(page, email, password);
	await dismissOnboardingModalIfOpen(page);
}

function appNavigation(page: Page) {
	return page.getByRole('navigation', { name: /Prim/i });
}

export async function openMoreNav(page: Page) {
	await appNavigation(page).getByRole('button', { name: 'Mer' }).click();
}

export async function clickNavHref(page: Page, href: string) {
	await dismissOnboardingModalIfOpen(page);
	await appNavigation(page).locator(`a[href="${href}"]`).click();
}

export async function clickSecondaryNavHref(page: Page, href: string) {
	await openMoreNav(page);
	await page
		.locator(`#nav-more-desktop a[href="${href}"], #nav-more-sheet a[href="${href}"]`)
		.first()
		.click();
}


