import { test, expect, type Page } from '@playwright/test';
import {
	dismissCookieConsentIfOpen,
	dismissOnboardingModalIfOpen,
	loginAsAdmin,
	registerNewUser
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

test.describe('Growth wave — wrapped, rapport, dela', () => {
	test.use({ actionTimeout: 45_000 });

	test('public rapport page loads for valid month', async ({ page }) => {
		await page.goto('/rapport/2025-06', { waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);

		await expect(page.getByRole('heading', { level: 1 })).toContainText(/2025-06|Så kastar svenska/i);
		await expect(page.getByText(/Skaffurapporten|Skaffu report/i).first()).toBeVisible();
		await expect(
			page.getByText(/publicerar detaljerade insikter|publish detailed insights|Beta-kohort|Beta cohort/i).first()
		).toBeVisible();
	});

	test('wrapped slide flow and empty-month copy for new household', async ({ page }) => {
		test.setTimeout(90_000);
		await registerNewUser(page);
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

	test('wrapped streak regression — new household never shows inflated copy', async ({ page }) => {
		test.setTimeout(90_000);
		await registerNewUser(page);
		await page.goto('/statistik/wrapped', { waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		const flow = page.getByTestId('wrapped-flow');
		await expect(flow).toBeVisible({ timeout: 20_000 });
		await expect(page.getByTestId('wrapped-slide-title')).toHaveText(
			/Er första månad med Skaffu|Your first month with Skaffu/i
		);

		const inflatedStreak = /[2-9]\d*\s*veckors?\s+zero-waste|[2-9]\d*-week zero-waste/i;
		const nextBtn = flow.getByRole('button', { name: /^Nästa$|^Next$/i });
		for (let step = 0; step < 8; step += 1) {
			const title = page.getByTestId('wrapped-slide-title');
			if (await title.isVisible()) {
				await expect(title).not.toHaveText(inflatedStreak);
			}
			await expect(page.getByText(inflatedStreak)).toHaveCount(0);
			if (!(await nextBtn.isVisible())) {
				break;
			}
			await nextBtn.click();
		}
	});

	test('expiring share card button visible on home when items expiring', async ({ page }) => {
		test.setTimeout(60_000);
		const itemName = `E2E ShareCard ${Date.now()}`;
		const expiresOn = dateWithinExpiringSoonDays(2);

		await loginAsAdmin(page);
		await createFridgeItemViaAction(page, { name: itemName, expiresOn });
		await page.goto('/hem', { waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByText(itemName)).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole('button', { name: /Dela som bild|Share as image/i })
		).toBeVisible({ timeout: 15_000 });
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
		await expect(
			page.getByRole('link', { name: /Prova Skaffu|Try Skaffu/i })
		).toHaveAttribute(
			'href',
			'https://skaffu.com/?utm_source=facebook&utm_medium=community&utm_campaign=matsvinn_w12&utm_content=grannskafferiet'
		);
	});

	test('nearby sharing settings API accepts opt-out', async ({ page }) => {
		await loginAsAdmin(page);

		const settingsResponse = await page.request.post('/api/expiring-share/nearby-settings', {
			data: { enabled: false }
		});
		expect(settingsResponse.ok()).toBeTruthy();
		const settingsPayload = (await settingsResponse.json()) as { ok: boolean; enabled: boolean };
		expect(settingsPayload.ok).toBe(true);
		expect(settingsPayload.enabled).toBe(false);

		const nearbyResponse = await page.request.get('/api/expiring-share/nearby');
		expect(nearbyResponse.ok()).toBeTruthy();
		const nearbyPayload = (await nearbyResponse.json()) as {
			ok: boolean;
			optedIn: boolean;
			shares: unknown[];
		};
		expect(nearbyPayload.ok).toBe(true);
		expect(nearbyPayload.optedIn).toBe(false);
		expect(nearbyPayload.shares).toEqual([]);
	});

	test('nearby sharing settings API opt-in stores coarse location', async ({ page }) => {
		await loginAsAdmin(page);

		const optInResponse = await page.request.post('/api/expiring-share/nearby-settings', {
			data: { enabled: true, latitude: 59.329323, longitude: 18.068581 }
		});
		expect(optInResponse.ok()).toBeTruthy();
		const optInPayload = (await optInResponse.json()) as {
			ok: boolean;
			enabled: boolean;
			latitude: number;
			longitude: number;
		};
		expect(optInPayload.ok).toBe(true);
		expect(optInPayload.enabled).toBe(true);
		expect(optInPayload.latitude).toBe(59.329);
		expect(optInPayload.longitude).toBe(18.069);

		const getResponse = await page.request.get('/api/expiring-share/nearby-settings');
		expect(getResponse.ok()).toBeTruthy();
		const getPayload = (await getResponse.json()) as {
			ok: boolean;
			enabled: boolean;
			latitude: number;
			longitude: number;
		};
		expect(getPayload.enabled).toBe(true);
		expect(getPayload.latitude).toBe(59.329);
		expect(getPayload.longitude).toBe(18.069);

		const nearbyResponse = await page.request.get('/api/expiring-share/nearby');
		expect(nearbyResponse.ok()).toBeTruthy();
		const nearbyPayload = (await nearbyResponse.json()) as {
			ok: boolean;
			optedIn: boolean;
			shares: unknown[];
		};
		expect(nearbyPayload.ok).toBe(true);
		expect(nearbyPayload.optedIn).toBe(true);
		expect(Array.isArray(nearbyPayload.shares)).toBe(true);
	});
});
