import { test, expect, type Page } from '@playwright/test';
import {
	dismissCookieConsentIfOpen,
	dismissOnboardingModalIfOpen,
	loginAsAdmin,
	prepareE2eBrowserState,
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
		test.setTimeout(120_000);
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
		test.setTimeout(120_000);
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
		await page.goto('/inventory/fridge', { waitUntil: 'commit' });
		await dismissOnboardingModalIfOpen(page);
		await expect(page.getByRole('link', { name: new RegExp(itemName) })).toBeVisible({
			timeout: 15_000
		});

		await page.goto('/hem', { waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByRole('heading', { level: 1 })).toContainText(
			/Veckohandel|Weekly shop/i
		);
		await expect(
			page.getByRole('button', { name: /Dela som bild|Share as image/i }).first()
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
			page.getByRole('link', { name: /Starta ditt Skaffu-skafferi|Start your Skaffu pantry/i })
		).toHaveAttribute(
			'href',
			'/register?utm_source=skaffu&utm_medium=product&utm_campaign=acquisition_wedge&utm_content=expiring_share'
		);
	});

	test('grannskafferiet discovery page loads for logged-in user', async ({ page }) => {
		await loginAsAdmin(page);

		const optInResponse = await page.request.post('/api/expiring-share/nearby-settings', {
			data: { enabled: true, latitude: 59.329323, longitude: 18.068581 }
		});
		expect(optInResponse.ok()).toBeTruthy();

		await page.goto('/grannskafferiet', { waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);
		await dismissOnboardingModalIfOpen(page);

		await expect(page.getByRole('heading', { level: 1 })).toContainText(
			/Grannskafferiet|Neighbour pantry/i
		);
		await expect(page.getByTestId('nearby-shares-map')).toBeVisible({ timeout: 15_000 });
	});

	test.skip('nearby sharing settings UI toggle enables and persists', async ({ page, context }) => {
		test.setTimeout(120_000);
		const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5190';
		await prepareE2eBrowserState(page);
		await context.grantPermissions(['geolocation'], { origin: baseURL });
		await context.setGeolocation({ latitude: 59.329323, longitude: 18.068581 });
		await page.addInitScript(() => {
			navigator.geolocation.getCurrentPosition = (success) => {
				success({
					coords: {
						latitude: 59.329323,
						longitude: 18.068581,
						accuracy: 10,
						altitude: null,
						altitudeAccuracy: null,
						heading: null,
						speed: null
					},
					timestamp: Date.now()
				} as GeolocationPosition);
			};
		});
		await loginAsAdmin(page);

		await page.request.post('/api/expiring-share/nearby-settings', { data: { enabled: false } });

		await page.goto('/settings#settings-nearby-sharing', { waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);

		const nearbySection = page.locator('#settings-nearby-sharing');
		await expect(nearbySection).toBeVisible({ timeout: 15_000 });

		const switchControl = nearbySection.getByRole('switch', {
			name: /Aktivera n\u00e4rliggande delningar|Enable nearby shares/i
		});
		await switchControl.scrollIntoViewIfNeeded();
		await expect(switchControl).toHaveAttribute('aria-checked', 'false');
		await expect(switchControl).toBeEnabled();

		const apiWait = page.waitForResponse(
			(res) =>
				res.url().includes('/api/expiring-share/nearby-settings') &&
				res.request().method() === 'POST',
			{ timeout: 90_000 }
		);
		// Tap switch (label has explicit handler too; switch is the primary mobile target).
		await switchControl.click();
		const apiResponse = await apiWait;
		expect(apiResponse.ok()).toBeTruthy();

		await expect(switchControl).toHaveAttribute('aria-checked', 'true', { timeout: 20_000 });

		await page.reload({ waitUntil: 'commit' });
		await dismissCookieConsentIfOpen(page);
		await switchControl.scrollIntoViewIfNeeded();
		await expect(switchControl).toHaveAttribute('aria-checked', 'true');
	});
});
