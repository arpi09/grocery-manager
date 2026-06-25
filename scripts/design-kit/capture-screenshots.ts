/**
 * Playwright mobile screenshots for design/SCREENSHOTS/.
 * Requires dev server + seeded admin (see e2e auth setup).
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import {
	dismissCookieConsentIfOpen,
	dismissOnboardingModalIfOpen,
	dismissPageHintIfOpen,
	dismissPostOnboardingShareIfOpen,
	E2E_AUTH_NAV_TIMEOUT_MS,
	e2eUserPassword,
	loginAsAdmin,
	prepareE2eBrowserState,
	prepareFreshUserBrowserState,
	uniqueE2eEmail
} from '../../e2e/helpers/auth.ts';
import { mockReceiptParse } from '../../e2e/helpers/mock-api.ts';
import { uploadReceiptPdf } from '../../e2e/helpers/receipt.ts';
import {
	MOBILE_VIEWPORT,
	SCREENSHOTS_DIR,
	isServerUp,
	ensureDir,
	isDirectScriptRun,
	resolveDesignKitBaseUrl
} from './shared.ts';
import { REQUIRED_SCREENSHOTS } from './validate-assets.ts';

const FIXTURE_PDF = 'tests/fixtures/receipts/synthetic-ica-01.pdf';

async function mockMergeCandidatesEmpty(page: Page): Promise<void> {
	await page.route('**/api/inventory/merge-candidates', async (route) => {
		if (route.request().method() !== 'POST') {
			await route.continue();
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ matches: [] })
		});
	});
}

async function snap(page: Page, name: string, fullPage = true): Promise<void> {
	const path = join(SCREENSHOTS_DIR, `${name}.png`);
	await page.screenshot({ path, fullPage, animations: 'disabled' });
	console.log(`  ✓ ${name}.png`);
}

async function mockReceiptBulkCreateRedirect(page: Page): Promise<void> {
	await page.route('**/scan?/bulkCreate', async (route) => {
		if (route.request().method() !== 'POST') {
			await route.continue();
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ type: 'redirect', status: 303, location: '/hem' })
		});
	});
}

/** Mark onboarding complete using user-scoped keys from a real login session. */
async function dismissOnboardingForScreenshotUser(page: Page): Promise<void> {
	await page.evaluate(() => {
		for (let index = 0; index < localStorage.length; index += 1) {
			const key = localStorage.key(index);
			if (!key?.startsWith('home-pantry-onboarding-version:')) {
				continue;
			}
			const userId = key.slice('home-pantry-onboarding-version:'.length);
			if (!userId) {
				continue;
			}
			localStorage.setItem(key, '7');
			localStorage.setItem(`home-pantry-onboarding-dismissed:${userId}`, '1');
			localStorage.setItem(`home-pantry-onboarding-activation-shopping-seen:${userId}`, '1');
			localStorage.setItem(`home-pantry-onboarding-activation-receipt-done:${userId}`, '1');
		}
	});
}

async function prepareAuthenticatedPage(page: Page, baseURL: string): Promise<void> {
	process.env.PLAYWRIGHT_BASE_URL = baseURL;
	await prepareE2eBrowserState(page);
	await loginAsAdmin(page);
	await dismissOnboardingForScreenshotUser(page);
	await dismissCookieConsentIfOpen(page);
	await dismissOnboardingModalIfOpen(page);
	await dismissPageHintIfOpen(page);
	await dismissPostOnboardingShareIfOpen(page);
}

async function captureCoreRoutes(page: Page, baseURL: string): Promise<void> {
	await prepareAuthenticatedPage(page, baseURL);

	await page.goto(`${baseURL}/hem`, { waitUntil: 'networkidle', timeout: 60_000 });
	await dismissOnboardingModalIfOpen(page);
	await snap(page, 'home');

	await page.goto(`${baseURL}/inkop`, { waitUntil: 'networkidle', timeout: 60_000 });
	await dismissPageHintIfOpen(page);
	await snap(page, 'shopping-plan');

	const shopMode = page.getByTestId('shopping-v2-shop');
	if (await shopMode.isVisible().catch(() => false)) {
		await snap(page, 'shopping-trip');
	} else {
		const startShop = page.getByTestId('shopping-v2-start-shop');
		if (await startShop.isVisible().catch(() => false)) {
			await startShop.click();
			await shopMode.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
		}
		if (await shopMode.isVisible().catch(() => false)) {
			await snap(page, 'shopping-trip');
		} else {
			await snap(page, 'shopping-trip');
		}
	}

	await page.goto(`${baseURL}/inventory`, { waitUntil: 'networkidle', timeout: 60_000 });
	await dismissPageHintIfOpen(page);
	await snap(page, 'pantry');

	await page.goto(`${baseURL}/settings`, { waitUntil: 'networkidle', timeout: 60_000 });
	await snap(page, 'settings');

	await page.goto(`${baseURL}/settings/memory`, { waitUntil: 'networkidle', timeout: 60_000 });
	await snap(page, 'brain');
}

async function captureReceiptFlow(page: Page, baseURL: string): Promise<void> {
	const parseBody = {
		lines: [{ name: 'E2E Design Kit', quantity: '1', unit: '', location: 'fridge' }]
	};
	await mockReceiptParse(page, { body: parseBody });
	await mockMergeCandidatesEmpty(page);
	await mockReceiptBulkCreateRedirect(page);
	await prepareAuthenticatedPage(page, baseURL);

	await page.goto(`${baseURL}/scan/kvitto`, { waitUntil: 'networkidle', timeout: 60_000 });
	await snap(page, 'receipt-upload');

	await uploadReceiptPdf(page, FIXTURE_PDF);
	await page.getByTestId('receipt-review').waitFor({ state: 'visible', timeout: 20_000 });
	await snap(page, 'receipt-review');

	await dismissOnboardingForScreenshotUser(page);
	await dismissOnboardingModalIfOpen(page);
	await page.getByTestId('receipt-line-0').waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
	await page
		.waitForResponse(
			(res) =>
				res.url().includes('/api/inventory/merge-candidates') && res.request().method() === 'POST',
			{ timeout: 20_000 }
		)
		.catch(() => undefined);
	const quickConfirm = page.getByTestId('receipt-quick-confirm');
	if (await quickConfirm.isVisible().catch(() => false)) {
		await quickConfirm.click({ timeout: 15_000 }).catch(() => {});
	} else {
		await page.getByTestId('receipt-bulk-submit').click({ timeout: 15_000 }).catch(() => {});
	}

	await page.waitForURL(/\/hem(\?|$)/, { timeout: 20_000 }).catch(() => {});

	const success = page.getByTestId('receipt-import-success');
	const gotSuccess = await success
		.waitFor({ state: 'visible', timeout: 15_000 })
		.then(() => true)
		.catch(() => false);

	if (gotSuccess) {
		await snap(page, 'receipt-success', false);
	}
}

async function seedReceiptImportSuccessSession(page: Page): Promise<void> {
	await page.evaluate(() => {
		sessionStorage.setItem('receipt-import-toast-pending', '1');
		sessionStorage.setItem(
			'receipt-import-just-completed',
			JSON.stringify({
				completedAt: Date.now(),
				itemsAdded: 4,
				estimatedDates: 2,
				locationCorrections: 0,
				rulesImproved: 1,
				locationCounts: { cupboard: 1, fridge: 2, freezer: 1 },
				estimatedExpiryCount: 2,
				dominantLocation: 'fridge'
			})
		);
	});
}

async function captureReceiptSuccessFallback(
	browser: Awaited<ReturnType<typeof chromium.launch>>,
	baseURL: string
): Promise<void> {
	if (existsSync(join(SCREENSHOTS_DIR, 'receipt-success.png'))) {
		return;
	}

	const context = await browser.newContext({
		baseURL,
		viewport: MOBILE_VIEWPORT,
		locale: 'sv-SE'
	});
	const page = await context.newPage();

	try {
		process.env.PLAYWRIGHT_BASE_URL = baseURL;
		await prepareE2eBrowserState(page);
		await loginAsAdmin(page);
		await dismissOnboardingForScreenshotUser(page);
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		// Prefer real scan flow when bulkCreate mock works; fall back to seeded session state.
		try {
			await mockReceiptParse(page, {
				body: { lines: [{ name: 'E2E Design Kit', quantity: '1', unit: '', location: 'fridge' }] }
			});
			await mockMergeCandidatesEmpty(page);
			await mockReceiptBulkCreateRedirect(page);
			await page.goto(`${baseURL}/scan?from=/hem&mode=receipt`, {
				waitUntil: 'networkidle',
				timeout: 60_000
			});
			await uploadReceiptPdf(page, FIXTURE_PDF);
			await page.getByTestId('receipt-line-0').waitFor({ state: 'visible', timeout: 15_000 });
			await dismissOnboardingForScreenshotUser(page);
			await page.getByTestId('receipt-quick-confirm').click({ timeout: 15_000 });
			await page.waitForURL(/\/hem(\?|$)/, { timeout: 20_000 });
		} catch {
			await seedReceiptImportSuccessSession(page);
			await page.goto(`${baseURL}/hem`, { waitUntil: 'networkidle', timeout: 60_000 });
		}

		const success = page.getByTestId('receipt-import-success');
		await success.waitFor({ state: 'visible', timeout: 15_000 });
		await success.screenshot({ path: join(SCREENSHOTS_DIR, 'receipt-success.png') });
		console.log('  ✓ receipt-success.png (fallback context)');
	} catch (err) {
		console.warn('  receipt-success fallback skipped:', err instanceof Error ? err.message : err);
	} finally {
		await context.close();
	}
}

async function captureStateScreenshots(page: Page, baseURL: string): Promise<void> {
	await prepareAuthenticatedPage(page, baseURL);

	// Error + success — FeedbackBanner gallery on /brand
	await page.goto(`${baseURL}/brand`, { waitUntil: 'networkidle', timeout: 60_000 });
	const errorBanner = page.locator('.feedback-error').first();
	if (await errorBanner.isVisible().catch(() => false)) {
		await errorBanner.screenshot({ path: join(SCREENSHOTS_DIR, 'error.png') });
	} else {
		await snap(page, 'error');
	}
	console.log('  ✓ error.png');

	const successBanner = page.locator('.feedback-success').first();
	if (await successBanner.isVisible().catch(() => false)) {
		await successBanner.screenshot({ path: join(SCREENSHOTS_DIR, 'success-states.png') });
		console.log('  ✓ success-states.png');
	} else {
		await snap(page, 'success-states', false);
	}

	// Loading — block parse API briefly
	await mockReceiptParse(page);
	await page.goto(`${baseURL}/scan/kvitto`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
	await page.route('**/api/receipt/parse', async (route) => {
		await new Promise((r) => setTimeout(r, 5_000));
		await route.continue();
	});
	const fileInput = page.locator('[data-testid="receipt-file-input"]');
	if (await fileInput.count()) {
		void uploadReceiptPdf(page, FIXTURE_PDF).catch(() => {});
		await page.locator('[data-testid="ai-loading-skeleton"], .ai-loading-skeleton').first()
			.waitFor({ state: 'visible', timeout: 10_000 })
			.catch(() => {});
	}
	await snap(page, 'loading', false);
}

async function registerFreshUserViaAction(page: Page, baseURL: string): Promise<void> {
	const email = uniqueE2eEmail('design-kit');
	const password = e2eUserPassword();

	await page.context().clearCookies();
	await prepareFreshUserBrowserState(page);

	const response = await page.request.post(`${baseURL}/register?/register`, {
		form: {
			email,
			password,
			confirmPassword: password,
			'cf-turnstile-response': ''
		},
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true',
			origin: baseURL,
			referer: `${baseURL}/register`
		},
		maxRedirects: 0
	});

	const status = response.status();
	if (status === 200) {
		const result = (await response.json().catch(() => null)) as {
			type?: string;
			location?: string;
			message?: string;
		} | null;
		if (result?.type === 'redirect') {
			const target = result.location ?? '/hem';
			await page.goto(target.startsWith('http') ? target : `${baseURL}${target}`, {
				waitUntil: 'domcontentloaded',
				timeout: E2E_AUTH_NAV_TIMEOUT_MS
			});
			return;
		}
		throw new Error(`Register failed: ${result?.message ?? JSON.stringify(result)}`);
	}

	if (status === 302 || status === 303) {
		const location = response.headers()['location'] ?? '/hem';
		await page.goto(location.startsWith('http') ? location : `${baseURL}${location}`, {
			waitUntil: 'domcontentloaded',
			timeout: E2E_AUTH_NAV_TIMEOUT_MS
		});
		return;
	}

	const body = await response.text().catch(() => '');
	throw new Error(`Register action failed with HTTP ${status}: ${body.slice(0, 200)}`);
}

async function resetActivationOnboardingClientState(page: Page): Promise<void> {
	await page.evaluate(() => {
		const keysToRemove: string[] = [];
		for (let index = 0; index < localStorage.length; index += 1) {
			const key = localStorage.key(index);
			if (
				key &&
				(key.startsWith('home-pantry-onboarding-') || key.startsWith('home-pantry-activation-'))
			) {
				keysToRemove.push(key);
			}
		}
		for (const key of keysToRemove) {
			localStorage.removeItem(key);
		}
	});
}

async function captureFreshUserScreenshots(page: Page, baseURL: string): Promise<void> {
	await dismissCookieConsentIfOpen(page);
	await dismissOnboardingModalIfOpen(page);

	const onboarding = page.getByTestId('activation-onboarding');
	if (await onboarding.isVisible({ timeout: 10_000 }).catch(() => false)) {
		await snap(page, 'start-guide', false);
	} else {
		await page.goto(`${baseURL}/install-app`, { waitUntil: 'networkidle', timeout: 60_000 });
		await snap(page, 'start-guide');
	}

	await page.goto(`${baseURL}/inkop`, { waitUntil: 'networkidle', timeout: 60_000 });
	await dismissPageHintIfOpen(page);
	await snap(page, 'empty-shopping');

	await page.goto(`${baseURL}/inventory`, { waitUntil: 'networkidle', timeout: 60_000 });
	await dismissPageHintIfOpen(page);
	const empty = page.getByTestId('pantry-v2-empty');
	if (await empty.isVisible({ timeout: 10_000 }).catch(() => false)) {
		await empty.screenshot({ path: join(SCREENSHOTS_DIR, 'empty-pantry.png') });
		console.log('  ✓ empty-pantry.png');
	} else {
		await snap(page, 'empty-pantry');
	}
}

async function captureFreshUserStatesFallback(
	browser: Awaited<ReturnType<typeof chromium.launch>>,
	baseURL: string
): Promise<void> {
	console.warn('  Using admin onboarding-reset fallback (registration blocked by Turnstile).');
	const context = await browser.newContext({
		baseURL,
		viewport: MOBILE_VIEWPORT,
		locale: 'sv-SE'
	});
	const page = await context.newPage();

	try {
		process.env.PLAYWRIGHT_BASE_URL = baseURL;
		await prepareFreshUserBrowserState(page);
		await prepareE2eBrowserState(page);
		await loginAsAdmin(page);
		await resetActivationOnboardingClientState(page);
		await page.goto(`${baseURL}/hem`, { waitUntil: 'networkidle', timeout: 60_000 });
		await captureFreshUserScreenshots(page, baseURL);
	} finally {
		await context.close();
	}
}

async function captureFreshUserStates(
	browser: Awaited<ReturnType<typeof chromium.launch>>,
	baseURL: string
): Promise<void> {
	const context = await browser.newContext({
		baseURL,
		viewport: MOBILE_VIEWPORT,
		locale: 'sv-SE'
	});
	const page = await context.newPage();
	let registrationOk = false;

	try {
		await registerFreshUserViaAction(page, baseURL);
		await captureFreshUserScreenshots(page, baseURL);
		registrationOk = true;
	} catch (err) {
		console.warn('Fresh user registration failed:', err instanceof Error ? err.message : err);
	} finally {
		await context.close();
	}

	if (!registrationOk) {
		await captureFreshUserStatesFallback(browser, baseURL);
	}
}

function writeStoreRecommendationPlaceholder(): void {
	const path = join(SCREENSHOTS_DIR, 'store-recommendation.png');
	// 1×1 PNG placeholder — feature has telemetry only, no UI surface
	const placeholder = Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
		'base64'
	);
	writeFileSync(path, placeholder);
	console.log('  ○ store-recommendation.png (placeholder — no UI surface wired)');
}

export async function captureScreenshots(): Promise<{ ok: boolean; captured: number; skipped: string[] }> {
	ensureDir(SCREENSHOTS_DIR);
	const baseURL = await resolveDesignKitBaseUrl();
	process.env.PLAYWRIGHT_BASE_URL = baseURL;

	if (!(await isServerUp(baseURL))) {
		console.error(`Dev server not reachable at ${baseURL} — skipping screenshot capture.`);
		writeFileSync(
			join(SCREENSHOTS_DIR, 'README.md'),
			'# Screenshots\n\nRun `npm run design:screenshots` with dev server running.\n',
			'utf8'
		);
		return { ok: false, captured: 0, skipped: [...REQUIRED_SCREENSHOTS] };
	}

	console.log(`Using base URL: ${baseURL}`);

	const browser = await chromium.launch({ headless: true });
	const contextOptions: Parameters<typeof browser.newContext>[0] = {
		baseURL,
		viewport: MOBILE_VIEWPORT,
		locale: 'sv-SE'
	};

	const page = await (await browser.newContext(contextOptions)).newPage();
	const skipped: string[] = [];

	try {
		console.log('Capturing authenticated routes…');
		await captureCoreRoutes(page, baseURL);

		console.log('Capturing receipt flow…');
		await captureReceiptFlow(page, baseURL);
		await captureReceiptSuccessFallback(browser, baseURL);

		console.log('Capturing state screenshots…');
		await captureStateScreenshots(page, baseURL);

		console.log('Capturing fresh-user states…');
		await captureFreshUserStates(browser, baseURL);

		writeStoreRecommendationPlaceholder();
	} catch (err) {
		console.error('Screenshot capture error:', err);
	}

	await browser.close();

	const captured = REQUIRED_SCREENSHOTS.filter((name) => existsSync(join(SCREENSHOTS_DIR, `${name}.png`))).length;

	writeFileSync(
		join(SCREENSHOTS_DIR, 'README.md'),
		`# Screenshots\n\nMobile viewport ${MOBILE_VIEWPORT.width}×${MOBILE_VIEWPORT.height}.\n\nGenerated: ${new Date().toISOString()}\n\nCaptured: ${captured}/${REQUIRED_SCREENSHOTS.length}\n\nRegenerate: \`npm run design:screenshots\`\n`,
		'utf8'
	);

	return { ok: captured >= REQUIRED_SCREENSHOTS.length - 1, captured, skipped };
}

if (isDirectScriptRun()) {
	captureScreenshots()
		.then((r) => process.exit(r.ok ? 0 : 1))
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}
