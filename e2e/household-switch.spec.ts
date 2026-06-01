import { test, expect, type Locator, type Page } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

const E2E_SECOND_PANTRY = 'E2E Testhem';

function navRoot(page: Page, mode: 'desktop' | 'mobile'): Locator {
	return page.locator(mode === 'desktop' ? '.main-nav-desktop' : '.main-nav-mobile');
}

async function openPantrySwitcher(page: Page, mode: 'desktop' | 'mobile') {
	const root = navRoot(page, mode);
	const trigger = root.getByRole('button', { name: /Byt pantry/i });
	await expect(trigger).toBeVisible();
	await trigger.click();

	if (mode === 'desktop') {
		await expect(root.getByRole('listbox', { name: /Dina pantries/i })).toBeVisible();
		return;
	}

	await expect(page.getByRole('dialog', { name: /Byt pantry/i })).toBeVisible();
}

async function ensureSecondPantry(page: Page, mode: 'desktop' | 'mobile') {
	await openPantrySwitcher(page, mode);
	const root = navRoot(page, mode);

	const existing = mode === 'desktop'
		? root.getByRole('option', { name: E2E_SECOND_PANTRY })
		: page.getByRole('dialog', { name: /Byt pantry/i }).getByRole('button', { name: E2E_SECOND_PANTRY, exact: true });

	if (await existing.isVisible().catch(() => false)) {
		return;
	}

	const createScope = mode === 'desktop' ? root : page.getByRole('dialog', { name: /Byt pantry/i });
	await createScope.getByRole('button', { name: /Skapa ny pantry/i }).click();
	await createScope.locator('input[name="name"]').fill(E2E_SECOND_PANTRY);
	await createScope.getByRole('button', { name: /^Skapa$/i }).click();

	await expect(
		navRoot(page, mode).getByRole('button', { name: new RegExp(`Byt pantry, nuvarande: ${E2E_SECOND_PANTRY}`) })
	).toBeVisible({ timeout: 15_000 });
}

async function switchToPantry(page: Page, mode: 'desktop' | 'mobile', name: string) {
	await openPantrySwitcher(page, mode);

	if (mode === 'desktop') {
		await navRoot(page, mode).getByRole('option', { name }).click();
	} else {
		await page
			.getByRole('dialog', { name: /Byt pantry/i })
			.getByRole('button', { name, exact: true })
			.click();
	}

	await expect(
		navRoot(page, mode).getByRole('button', { name: new RegExp(`Byt pantry, nuvarande: ${name}`) })
	).toBeVisible({ timeout: 15_000 });
}

test.describe('Household switcher', () => {
	test.setTimeout(90_000);

	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('switches pantry from a non-home page (desktop)', async ({ page }) => {
		await page.goto('/inkop');
		await dismissOnboardingModalIfOpen(page);

		const initialTrigger = navRoot(page, 'desktop')
			.getByRole('button', { name: /Byt pantry, nuvarande:/i });
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
		await expect(
			navRoot(page, 'mobile').getByRole('button', {
				name: new RegExp(`Byt pantry, nuvarande: ${E2E_SECOND_PANTRY}`)
			})
		).toBeVisible();
	});
});
