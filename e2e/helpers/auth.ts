import { expect, type Page } from '@playwright/test';
import { LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY } from '../../src/lib/i18n/locale';
import { PAGE_HINT_IDS } from '../../src/lib/utils/page-hints';
import { expectHomeDashboardVisible } from './home';

const ONBOARDING_VERSION = '4';
const PAGE_HINT_STORAGE_PREFIX = 'home-pantry-page-hint-dismissed';
const E2E_LOCALE = 'sv';
/** Locale only â€” onboarding and activation state stay fresh (new-user flows). */
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
		({ version, activationReceiptKey, celebrationKey, pageHintIds, pageHintPrefix }) => {
			// Only clear legacy (non user-scoped) keys â€” wiping per-user keys re-opens the guide on every navigation.
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
				localStorage.setItem(`home-pantry-post-onboarding-survey-dismissed:${userId}`, '1');
				localStorage.removeItem(`home-pantry-post-onboarding-survey-pending:${userId}`);
				for (const hintId of pageHintIds) {
					localStorage.setItem(`${pageHintPrefix}:${hintId}:${userId}`, '1');
				}
			};

			(window as Window & { __hpMarkOnboardingComplete?: (userId: string) => void }).__hpMarkOnboardingComplete =
				markCompleteForUser;
		},
		{
			version: ONBOARDING_VERSION,
			activationReceiptKey: 'home-pantry-onboarding-activation-receipt-done',
			celebrationKey: 'home-pantry-onboarding-celebration-pending',
			pageHintIds: [...PAGE_HINT_IDS],
			pageHintPrefix: PAGE_HINT_STORAGE_PREFIX
		}
	);
}

/** Must stay below Playwright test timeout (see playwright.config / per-spec setTimeout). */
export const E2E_AUTH_NAV_TIMEOUT_MS = 90_000;

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
			.click({ force: true });
		await dialog.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
	}
}

export async function dismissReceiptSuccessIfOpen(page: Page) {
	const modal = page.getByTestId('receipt-import-success');
	if (await modal.isVisible().catch(() => false)) {
		await page.keyboard.press('Escape').catch(() => {});
		await modal.waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
	}
}

export async function dismissPostOnboardingShareIfOpen(page: Page) {
	const skip = page.getByTestId('post-onboarding-share-skip');
	if (await skip.isVisible().catch(() => false)) {
		await skip.click({ force: true, timeout: 1_000 }).catch(() => {});
		await page
			.locator('.post-onboarding-share-panel')
			.waitFor({ state: 'hidden', timeout: 1_000 })
			.catch(() => {});
	}
}

export async function dismissPageHintIfOpen(page: Page) {
	const dismiss = page.getByTestId('page-hint-dismiss');
	if (await dismiss.isVisible().catch(() => false)) {
		await dismiss.click({ force: true, timeout: 1_000 }).catch(() => {});
		await page.locator('.page-hint-panel').waitFor({ state: 'hidden', timeout: 1_000 }).catch(() => {});
	}
}

export async function dismissPostOnboardingSurveyIfOpen(page: Page) {
	const skipByTestId = page.getByTestId('post-onboarding-survey-skip');
	if (await skipByTestId.isVisible().catch(() => false)) {
		await skipByTestId.click({ force: true, timeout: 1_000 }).catch(() => {});
		await page.locator('.post-onboarding-survey-panel').waitFor({ state: 'hidden', timeout: 1_000 }).catch(() => {});
		return;
	}

	const skip = page.getByRole('button', { name: /^(Inte nu|Not now)$/i });
	if (await skip.first().isVisible().catch(() => false)) {
		await skip.first().click({ force: true, timeout: 1_000 }).catch(() => {});
		await page.locator('.post-onboarding-survey-panel').waitFor({ state: 'hidden', timeout: 1_000 }).catch(() => {});
	}
}

export async function dismissOnboardingModalIfOpen(page: Page) {
	const modal = page.locator('.modal-root').first();
	const pageHintDismiss = page.getByTestId('page-hint-dismiss');
	const clickIfVisible = async (locator: ReturnType<Page['locator']>) => {
		const target = locator.first();
		if (await target.isVisible().catch(() => false)) {
			await target.click({ force: true, timeout: 750 }).catch(() => {});
			return true;
		}
		return false;
	};
	const hasBlockingOverlay = async () =>
		(await modal.isVisible().catch(() => false)) ||
		(await page.getByTestId('receipt-import-success').isVisible().catch(() => false)) ||
		(await pageHintDismiss.isVisible().catch(() => false)) ||
		(await page.getByTestId('post-onboarding-survey-skip').isVisible().catch(() => false)) ||
		(await page.getByTestId('post-onboarding-share-skip').isVisible().catch(() => false)) ||
		(await page.getByRole('button', { name: /^(Inte nu|Not now)$/i }).first().isVisible().catch(() => false));

	const deadline = Date.now() + 5_000;
	while (Date.now() < deadline) {
		await clickIfVisible(page.getByRole('button', { name: /Endast n\u00f6dv\u00e4ndiga|Godk\u00e4nn/i }));
		await clickIfVisible(pageHintDismiss);
		await clickIfVisible(page.getByTestId('post-onboarding-share-skip'));
		await clickIfVisible(page.getByTestId('post-onboarding-survey-skip'));
		await dismissReceiptSuccessIfOpen(page);
		await clickIfVisible(page.getByRole('button', { name: /^(Inte nu|Not now)$/i }));

		if (await modal.isVisible().catch(() => false)) {
			const skipByTestId = page.getByTestId('activation-skip').or(page.getByTestId('onboarding-skip'));
			const genericSkip = page.getByRole('button', {
				name: /^(Hoppa Ã¶ver|Hoppa over|Jag gÃ¶r det senare|Skip)$/i
			});
			if (!(await clickIfVisible(skipByTestId)) && !(await clickIfVisible(genericSkip))) {
				await page.keyboard.press('Escape').catch(() => {});
			}
		}

		if (!(await hasBlockingOverlay())) {
			return;
		}
		await page.waitForTimeout(100);
	}
}

function isPostRegisterLanding(url: URL) {
	if (url.pathname === '/inkop') {
		return true;
	}
	if (url.pathname !== '/hem') {
		return false;
	}
	return (
		url.searchParams.get('welcome') === '1' ||
		url.searchParams.get('freshAccount') === '1'
	);
}

async function waitForPostRegisterHome(page: Page) {
	await page.waitForURL((url) => isPostRegisterLanding(url), {
		timeout: E2E_AUTH_NAV_TIMEOUT_MS,
		waitUntil: 'domcontentloaded'
	});
}

export async function waitForWelcomeParamStripped(page: Page) {
	await page
		.waitForURL(
			(url) =>
				url.pathname === '/hem' &&
				url.searchParams.get('welcome') !== '1' &&
				!url.searchParams.has('freshAccount'),
			{ timeout: 20_000 }
		)
		.catch(() => undefined);
}

export async function expectOnboardingGuideVisible(page: Page) {
	await dismissCookieConsentIfOpen(page);
	await expect(page.getByTestId('activation-onboarding')).toBeVisible({ timeout: 20_000 });
	await expect(page.getByTestId('activation-skip')).toBeVisible();
	await expect(page.getByTestId('activation-progress-welcome')).toBeVisible();
}

export async function expectActivationScreenHeading(page: Page, pattern: RegExp) {
	await expect(page.getByRole('heading', { name: pattern })).toBeVisible({ timeout: 20_000 });
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

	await page.context().clearCookies();
	await prepareFreshUserBrowserState(page);

	await page.goto('/register');
	await dismissCookieConsentIfOpen(page);
	await expect(page.getByTestId('register-submit')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('register-turnstile')).toHaveCount(0);

	const passwordInput = page.locator('input[name="password"]');
	const confirmInput = page.locator('input[name="confirmPassword"]');
	const emailInput = page.locator('input[name="email"]');

	await fillBoundInput(emailInput, email);
	await fillBoundInput(passwordInput, password);
	await fillBoundInput(confirmInput, password);

	const navigatedToHome = waitForPostRegisterHome(page);
	await page.getByTestId('register-submit').click({ noWaitAfter: true });

	const rateLimited = page.getByRole('alert').filter({
		hasText: /För många registreringsförsök|Too many registration attempts/i
	});
	if (await rateLimited.isVisible().catch(() => false)) {
		throw new Error(
			'Registration rate-limited — restart the E2E dev server (port 5190) or wait 15 minutes.'
		);
	}

	await navigatedToHome;

	return { email, password };
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
	await prepareE2eBrowserState(page);

	const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5190';
	const loginResponse = await page.request.post(`${baseURL}/login?/login`, {
		form: { email, password },
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true',
			origin: baseURL,
			referer: `${baseURL}/login`
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
			await page.goto(result.location ?? '/hem', {
				waitUntil: 'domcontentloaded',
				timeout: E2E_AUTH_NAV_TIMEOUT_MS
			});
		} else {
			throw new Error(`Login failed: ${result?.message ?? JSON.stringify(result)}`);
		}
	} else if (status === 302 || status === 303) {
		const location = loginResponse.headers()['location'] ?? '/hem';
		await page.goto(location.startsWith('http') ? location : `${baseURL}${location}`, {
			waitUntil: 'domcontentloaded',
			timeout: E2E_AUTH_NAV_TIMEOUT_MS
		});
	} else {
		throw new Error(`Login action failed with HTTP ${status}`);
	}

	await markE2eOnboardingComplete(page);
	await dismissCookieConsentIfOpen(page);
	await dismissOnboardingModalIfOpen(page);
	await dismissPostOnboardingSurveyIfOpen(page);
	await expect(
		page.locator('.shopping-page, section.home, section.home-v5, .home-v2-page')
	).toBeVisible({
		timeout: E2E_AUTH_NAV_TIMEOUT_MS
	});
	await expectHomeDashboardVisible(page);
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
	await dismissOnboardingModalIfOpen(page);
	await openMoreNav(page);
	const link = page
		.locator(`#nav-more-desktop a[href="${href}"], #nav-more-sheet a[href="${href}"]`)
		.first();
	await link.waitFor({ state: 'visible', timeout: 15_000 });
	await link.click();
}


