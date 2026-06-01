import { test, expect, type Locator, type Page } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { PANTRY_CREATE_ACTION, PANTRY_SWITCH_ACTION } from '../src/lib/navigation/app-home';

const E2E_SECOND_PANTRY = 'E2E Testhem';

function navRoot(page: Page, mode: 'desktop' | 'mobile'): Locator {
	return page.locator(mode === 'desktop' ? '.main-nav-desktop' : '.main-nav-mobile');
}

async function openPantrySwitcher(page: Page, mode: 'desktop' | 'mobile') {
	const root = navRoot(page, mode);
	const trigger = root.getByTestId('pantry-switcher-trigger');
	await expect(trigger).toBeVisible();
	await trigger.click();

	const menu =
		mode === 'desktop'
			? root.getByTestId('pantry-switcher-menu')
			: page.getByTestId('pantry-switcher-menu');
	await expect(menu).toBeVisible({ timeout: 10_000 });
}

async function ensureSecondPantry(page: Page, mode: 'desktop' | 'mobile') {
	await openPantrySwitcher(page, mode);
	const menu =
		mode === 'desktop'
			? navRoot(page, mode).getByTestId('pantry-switcher-menu')
			: page.getByTestId('pantry-switcher-menu');

	const existing =
		mode === 'desktop'
			? menu.getByRole('option', { name: E2E_SECOND_PANTRY })
			: menu.getByRole('button', { name: E2E_SECOND_PANTRY, exact: true });

	if (await existing.isVisible().catch(() => false)) {
		return;
	}

	await menu.getByRole('button', { name: /Skapa ny pantry/i }).click();
	await menu.locator('input[name="name"]').fill(E2E_SECOND_PANTRY);
	await menu.getByRole('button', { name: /^Skapa$/i }).click();

	await expect(
		navRoot(page, mode).getByTestId('pantry-switcher-trigger')
	).toHaveAttribute('aria-label', new RegExp(`Byt pantry, nuvarande: ${E2E_SECOND_PANTRY}`), {
		timeout: 15_000
	});
}

async function switchToPantry(page: Page, mode: 'desktop' | 'mobile', name: string) {
	await openPantrySwitcher(page, mode);
	const menu =
		mode === 'desktop'
			? navRoot(page, mode).getByTestId('pantry-switcher-menu')
			: page.getByTestId('pantry-switcher-menu');

	if (mode === 'desktop') {
		await menu.getByRole('option', { name }).click();
	} else {
		await menu.getByRole('button', { name, exact: true }).click();
	}

	await expect(
		navRoot(page, mode).getByTestId('pantry-switcher-trigger')
	).toHaveAttribute('aria-label', new RegExp(`Byt pantry, nuvarande: ${name}`), {
		timeout: 15_000
	});
}

test.describe('Household switcher', () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('forms post to /hem actions from any app page', async ({ page }) => {
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		await expect(navRoot(page, 'desktop').locator(`form[action="${PANTRY_SWITCH_ACTION}"]`).first()).toBeAttached();
		await expect(navRoot(page, 'desktop').locator(`form[action="${PANTRY_CREATE_ACTION}"]`).first()).toBeAttached();
	});

	test('switches pantry from a non-home page (desktop)', async ({ page }) => {
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		const initialTrigger = navRoot(page, 'desktop').getByTestId('pantry-switcher-trigger');
		const initialName = (await initialTrigger.getAttribute('aria-label'))?.replace(
			/^Byt pantry, nuvarande: /,
			''
		);
		expect(initialName).toBeTruthy();

		await ensureSecondPantry(page, 'desktop');
		await switchToPantry(page, 'desktop', E2E_SECOND_PANTRY);
		await switchToPantry(page, 'desktop', initialName!);

		await expect(page).toHaveURL(/\/inkop/);
	});
});

test.describe('Household switcher (mobile)', () => {
	test.setTimeout(90_000);
	test.use({ viewport: { width: 390, height: 844 } });

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('switches pantry from mobile header', async ({ page }) => {
		await page.goto('/planer');
		await dismissOnboardingModalIfOpen(page);

		await ensureSecondPantry(page, 'mobile');
		await switchToPantry(page, 'mobile', E2E_SECOND_PANTRY);

		await expect(page).toHaveURL(/\/planer/);
		await expect(navRoot(page, 'mobile').getByTestId('pantry-switcher-trigger')).toHaveAttribute(
			'aria-label',
			new RegExp(`Byt pantry, nuvarande: ${E2E_SECOND_PANTRY}`)
		);
	});
});
