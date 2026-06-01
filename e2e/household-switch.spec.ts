import { test, expect, type Page } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { PANTRY_CREATE_ACTION, PANTRY_SWITCH_ACTION } from '../src/lib/navigation/app-home';

const E2E_SECOND_PANTRY = 'E2E Testhem';
/** Matches `DEFAULT_HOUSEHOLD_ID` in seed-household.ts (seeded in PGlite for e2e). */
const SEEDED_HOUSEHOLD_ID = 'household-hemmet';

function switcherTrigger(page: Page, mode: 'desktop' | 'mobile') {
	const root = page.locator(mode === 'desktop' ? '.main-nav-desktop' : '.main-nav-mobile');
	return root.getByTestId(
		mode === 'desktop' ? 'pantry-switcher-trigger-desktop' : 'pantry-switcher-trigger-mobile'
	);
}

test.describe('Household switcher', () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('createHousehold and switchHousehold actions work at /hem from /inkop', async ({ page }) => {
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		await expect(switcherTrigger(page, 'desktop')).toHaveAttribute(
			'aria-label',
			/Byt pantry, nuvarande:/
		);

		const create = await page.request.post(PANTRY_CREATE_ACTION, {
			form: { name: E2E_SECOND_PANTRY, redirectTo: '/inkop' }
		});
		expect(create.status()).toBe(302);
		expect(create.headers()['location']).toBe('/inkop');

		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await expect(switcherTrigger(page, 'desktop')).toHaveAttribute(
			'aria-label',
			new RegExp(`Byt pantry, nuvarande: ${E2E_SECOND_PANTRY}`)
		);

		const switchBack = await page.request.post(PANTRY_SWITCH_ACTION, {
			form: { householdId: SEEDED_HOUSEHOLD_ID, redirectTo: '/inkop' }
		});
		expect(switchBack.status()).toBe(302);
		expect(switchBack.headers()['location']).toBe('/inkop');

		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);
		await expect(switcherTrigger(page, 'desktop')).toHaveAttribute(
			'aria-label',
			/Byt pantry, nuvarande: Hemmet/
		);
	});

	test('marketing root does not expose pantry switch actions', async ({ page }) => {
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		const badSwitch = await page.request.post('/?/switchHousehold', {
			form: { householdId: SEEDED_HOUSEHOLD_ID, redirectTo: '/hem' }
		});
		expect(badSwitch.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe('Household switcher (mobile)', () => {
	test.setTimeout(90_000);
	test.use({ viewport: { width: 390, height: 844 } });

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('reflects active pantry in mobile header after switch', async ({ page }) => {
		await page.goto('/planer');
		await dismissOnboardingModalIfOpen(page);

		const create = await page.request.post(PANTRY_CREATE_ACTION, {
			form: { name: E2E_SECOND_PANTRY, redirectTo: '/planer' }
		});
		expect(create.status()).toBe(302);

		await page.goto('/planer');
		await dismissOnboardingModalIfOpen(page);
		await expect(switcherTrigger(page, 'mobile')).toHaveAttribute(
			'aria-label',
			new RegExp(`Byt pantry, nuvarande: ${E2E_SECOND_PANTRY}`)
		);
	});
});
