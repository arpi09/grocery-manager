import { test, expect, type Page } from '@playwright/test';
import {
	dismissCookieConsentIfOpen,
	dismissOnboardingModalIfOpen,
	e2eUserPassword,
	loginAsAdmin,
	prepareFreshUserBrowserState,
	uniqueE2eEmail
} from './helpers/auth';

function dateWithinExpiringSoonDays(daysFromNow = 2): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return date.toISOString().slice(0, 10);
}

async function createFridgeItemViaAction(
	page: Page,
	options: { name: string; expiresOn: string }
): Promise<void> {
	const response = await page.request.post('/item/new?/create', {
		form: {
			name: options.name,
			location: 'fridge',
			quantity: '1',
			unit: '',
			expiresOn: options.expiresOn,
			notes: '',
			returnTo: '/inventory/fridge'
		},
		headers: {
			accept: 'application/json',
			'x-sveltekit-action': 'true'
		},
		maxRedirects: 0
	});

	const status = response.status();
	expect([200, 302, 303]).toContain(status);
}

async function registerFreshHousehold(page: Page) {
	const email = uniqueE2eEmail('wrapped-e2e');
	const password = e2eUserPassword();

	await prepareFreshUserBrowserState(page);
	await page.goto('/register', { waitUntil: 'commit' });
	await expect(page.getByTestId('register-submit')).toBeVisible({ timeout: 15_000 });

	await page.locator('input[name="email"]').fill(email);
	await page.locator('input[name="password"]').fill(password);
	await page.locator('input[name="confirmPassword"]').fill(password);
	await page.getByTestId('register-submit').click({ noWaitAfter: true });
	await page.waitForURL(/\/hem/, { timeout: 45_000, waitUntil: 'commit' });
}

test.describe('Growth wave — wrapped, rapport, dela', () => {
	test('wrapped slide flow and empty-month copy for new household', async ({ page }) => {
		test.setTimeout(90_000);
		await registerFreshHousehold(page);
		await page.goto('/statistik/wrapped', { waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		const flow = page.getByTestId('wrapped-flow');
		await expect(flow).toBeVisible({ timeout: 20_000 });
		await expect(page.getByTestId('wrapped-slide-title')).toHaveText(
			/Er första månad med Skaffu|Your first month with Skaffu/i
		);
		await expect(flow).toContainText(/här växer er berättelse|your story grows/i);

		await flow.getByRole('button', { name: /^Nästa$|^Next$/i }).click();
		await expect(page.getByRole('button', { name: /Ladda ner|Download/i })).toBeVisible({
			timeout: 10_000
		});
	});

	test('public rapport page loads for valid month', async ({ page }) => {
		await page.goto('/rapport/2025-06', { waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);

		await expect(page.getByRole('heading', { level: 1 })).toContainText(/2025-06|Så kastar svenska/i);
		await expect(page.getByText(/Skaffurapporten|Skaffu report/i).first()).toBeVisible();
		await expect(
			page.getByText(/publicerar detaljerade insikter|publish detailed insights|Beta-kohort|Beta cohort/i).first()
		).toBeVisible();
	});

	test('expiring share link opens public dela page', async ({ page }) => {
		test.setTimeout(60_000);
		const itemName = `E2E Dela ${Date.now()}`;
		const expiresOn = dateWithinExpiringSoonDays(2);

		await loginAsAdmin(page);
		await createFridgeItemViaAction(page, { name: itemName, expiresOn });

		const shareResponse = await page.request.post('/api/expiring-share');
		expect(shareResponse.ok()).toBeTruthy();
		const sharePayload = (await shareResponse.json()) as {
			ok: boolean;
			url?: string;
			itemCount?: number;
		};
		expect(sharePayload.ok).toBe(true);
		expect(sharePayload.itemCount).toBeGreaterThan(0);

		const shareUrl = new URL(sharePayload.url!);
		await page.goto(shareUrl.pathname, { waitUntil: 'commit' });
		await expect(page.getByRole('heading', { level: 1 })).toContainText(
			/Utgående varor|Expiring items/i
		);
		await expect(page.getByText(itemName)).toBeVisible();
		await expect(page.getByRole('note')).toContainText(/inga adresser|no addresses/i);
	});
});
