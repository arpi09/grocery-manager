import { expect, type Page } from '@playwright/test';
import { LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY } from '../../src/lib/i18n/locale';

const ONBOARDING_VERSION = '3';
const E2E_LOCALE = 'sv';
/** Locale only — onboarding and activation state stay fresh (new-user flows). */
export async function prepareFreshUserBrowserState(page: Page) {
	await applyE2eLocale(page);

	await page.addInitScript(() => {
		const keysToRemove: string[] = [];
		for (let index = 0; index < localStorage.length; index += 1) {
			const key = localStorage.key(index);
			if (key?.startsWith('home-pantry-onboarding-')) {
				keysToRemove.push(key);
			}
		}
		for (const key of keysToRemove) {
			localStorage.removeItem(key);
		}
	});
}

export async function prepareE2eBrowserState(page: Page) {
	await applyE2eLocale(page);

	await page.addInitScript(
		({ version, activationReceiptKey, celebrationKey }) => {
			// Only clear legacy (non user-scoped) keys — wiping per-user keys re-opens the guide on every navigation.
			const legacyPrefixes = [
				'home-pantry-onboarding-version',
				'home-pantry-onboarding-dismissed',
				'home-pantry-activation-path',
				'home-pantry-activation-barcode-count',
				'home-pantry-activation-receipt-done',
				'home-pantry-celebration-pending',
				'home-pantry-post-onboarding-survey-pending',
				'home-pantry-post-onboarding-survey-dismissed'
			];
			for (const prefix of legacyPrefixes) {
				localStorage.removeItem(prefix);
			}

			const markCompleteForUser = (userId: string) => {
				localStorage.setItem(`home-pantry-onboarding-version:${userId}`, version);
				localStorage.setItem(`home-pantry-onboarding-dismissed:${userId}`, '1');
				localStorage.setItem(`${activationReceiptKey}:${userId}`, '1');
				localStorage.removeItem(`${celebrationKey}:${userId}`);
			};

			(window as Window & { __hpMarkOnboardingComplete?: (userId: string) => void }).__hpMarkOnboardingComplete =
				markCompleteForUser;
		},
		{
			version: ONBOARDING_VERSION,
			activationReceiptKey: 'home-pantry-onboarding-activation-receipt-done',
			celebrationKey: 'home-pantry-onboarding-celebration-pending'
		}
	);
}

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

async function fillBoundInput(input: import('@playwright/test').Locator, value: string) {
	await input.click();
	await input.fill(value);

	if ((await input.inputValue()) !== value) {
		await input.pressSequentially(value, { delay: 10 });
	}

	if ((await input.inputValue()) !== value) {
		await input.evaluate((element, nextValue) => {
			const field = element as HTMLInputElement;
			field.value = nextValue;
			field.dispatchEvent(new Event('input', { bubbles: true }));
			field.dispatchEvent(new Event('change', { bubbles: true }));
		}, value);
	}

	await expect(input).toHaveValue(value, { timeout: 15_000 });
}

export async function dismissCookieConsentIfOpen(page: Page) {
	const dialog = page.locator('[aria-labelledby="cookie-consent-title"]');
	if (await dialog.isVisible().catch(() => false)) {
		await page
			.getByRole('button', { name: /Endast n\u00f6dv\u00e4ndiga|Godk\u00e4nn/i })
			.first()
			.click();
		await dialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
	}
}

export async function dismissOnboardingModalIfOpen(page: Page) {
	await dismissCookieConsentIfOpen(page);

	for (let attempt = 0; attempt < 5; attempt += 1) {
		const modal = page.locator('.modal-root').first();
		if (!(await modal.isVisible().catch(() => false))) {
			break;
		}

		const skipByTestId = page.getByTestId('onboarding-skip');
		if (await skipByTestId.isVisible().catch(() => false)) {
			await skipByTestId.click({ force: true });
		} else {
			const skip = page.getByRole('button', {
				name: /^(Hoppa över|Hoppa over|Jag gör det senare|Skip)$/i
			});
			if (await skip.first().isVisible().catch(() => false)) {
				await skip.first().click({ force: true });
			} else {
				await page.keyboard.press('Escape');
			}
		}

		await modal.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
	}
}

async function waitForPostRegisterScan(page: Page) {
	await page.waitForURL(
		(url) => url.pathname === '/scan' && url.searchParams.get('mode') === 'barcode',
		{
			timeout: E2E_AUTH_NAV_TIMEOUT_MS,
			waitUntil: 'commit'
		}
	);
	await page.waitForURL(
		(url) => url.pathname === '/scan' && !url.searchParams.has('freshAccount'),
		{ timeout: 20_000 }
	);
}

export async function expectOnboardingGuideVisible(page: Page) {
	await dismissCookieConsentIfOpen(page);
	await expect(
		page.getByRole('heading', { name: /V\u00e4lkommen till Skaffu/i })
	).toBeVisible({ timeout: 20_000 });
	await expect(page.getByTestId('onboarding-skip')).toBeVisible();
	await expect(page.getByText(/Steg 1 av 2/i)).toBeVisible();
}

async function markE2eOnboardingComplete(page: Page) {
	await page.evaluate(async () => {
		const mark = (window as Window & { __hpMarkOnboardingComplete?: (userId: string) => void })
			.__hpMarkOnboardingComplete;
		if (!mark) {
			return;
		}

		const dataUrl = new URL('__data.json', window.location.href);
		dataUrl.searchParams.set('x-sveltekit-invalidated', '01');
		const response = await fetch(dataUrl);
		if (!response.ok) {
			return;
		}

		const payload = (await response.json()) as {
			nodes?: Array<{ type?: string; data?: unknown[] }>;
		};

		for (const node of payload.nodes ?? []) {
			if (node.type !== 'data' || !Array.isArray(node.data)) {
				continue;
			}
			for (const entry of node.data) {
				if (
					entry &&
					typeof entry === 'object' &&
					'user' in entry &&
					entry.user &&
					typeof entry.user === 'object' &&
					'id' in entry.user &&
					typeof entry.user.id === 'string'
				) {
					mark(entry.user.id);
					return;
				}
			}
		}
	});
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

	const navigatedToScan = waitForPostRegisterScan(page);
	await page.getByTestId('register-submit').click();
	await navigatedToScan;

	return { email, password };
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
	await prepareE2eBrowserState(page);

	const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5190';
	const loginResponse = await page.request.post(`${baseURL}/login?/login`, {
		form: { email, password },
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		},
		maxRedirects: 0
	});

	const status = loginResponse.status();
	if (status === 200) {
		const result = (await loginResponse.json().catch(() => null)) as {
			type?: string;
			location?: string;
			message?: string;
		} | null;
		if (result?.type === 'redirect') {
			await page.goto(result.location ?? '/hem');
		} else {
			throw new Error(`Login failed: ${result?.message ?? JSON.stringify(result)}`);
		}
	} else if (status === 302 || status === 303) {
		const location = loginResponse.headers()['location'] ?? '/hem';
		await page.goto(location.startsWith('http') ? location : `${baseURL}${location}`);
	} else {
		throw new Error(`Login action failed with HTTP ${status}`);
	}

	await dismissCookieConsentIfOpen(page);
	await dismissOnboardingModalIfOpen(page);
	await expect(page.locator('section.home')).toBeVisible({ timeout: E2E_AUTH_NAV_TIMEOUT_MS });
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await markE2eOnboardingComplete(page);
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
	await appNavigation(page).locator(`a[href="${href}"]`).click({ force: true });
}

export async function clickSecondaryNavHref(page: Page, href: string) {
	await openMoreNav(page);
	await page
		.locator(`#nav-more-desktop a[href="${href}"], #nav-more-sheet a[href="${href}"]`)
		.first()
		.click();
}


