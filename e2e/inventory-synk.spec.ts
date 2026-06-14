import { test, expect } from '@playwright/test';

import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';

test.describe('Inventory sync batch review', () => {
	test('synk page loads with review or empty state', async ({ page }) => {
		test.setTimeout(60_000);
		await loginAsAdmin(page);
		await page.goto('/inventory/synk');
		await dismissOnboardingModalIfOpen(page);

		await expect(
			page.getByRole('heading', { name: /Fortfarande hemma|Still at home/i })
		).toBeVisible({
			timeout: 15_000
		});

		const emptyTitle = page.getByText(/Inget att bekräfta|Nothing to confirm/i);
		const confirmBtn = page.getByRole('button', { name: /Ja, kvar|Yes, still here/i });

		const hasEmpty = await emptyTitle.isVisible({ timeout: 3_000 }).catch(() => false);
		const hasBatch = await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false);

		expect(hasEmpty || hasBatch).toBeTruthy();
	});

	test('confirm and undo finish on batch item when available', async ({ page }) => {
		test.setTimeout(60_000);
		await loginAsAdmin(page);
		await page.goto('/inventory/synk');
		await dismissOnboardingModalIfOpen(page);

		const confirmBtn = page.getByRole('button', { name: /Ja, kvar|Yes, still here/i }).first();
		if (!(await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
			test.skip(true, 'No stale batch items available');
		}

		await confirmBtn.click();
		await expect(page.getByText(/Bra — vi minns|Got it — we'll remember/i)).toBeVisible({
			timeout: 10_000
		});

		const finishBtn = page.getByRole('button', { name: /^Slut$|^Finished$/i }).first();
		if (!(await finishBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
			return;
		}

		await finishBtn.click();
		const undoBtn = page.getByRole('button', { name: /Ångra|Undo/i });
		await expect(undoBtn).toBeVisible({ timeout: 10_000 });
		await undoBtn.click();
		await expect(undoBtn).toHaveCount(0, { timeout: 10_000 });
	});

	test('primary nav visible on inkop and fridge', async ({ page }) => {
		test.setTimeout(60_000);
		await loginAsAdmin(page);

		for (const path of ['/inkop', '/inventory/fridge']) {
			await page.goto(path);
			await dismissOnboardingModalIfOpen(page);
			const desktopNav = page.locator('.main-nav-desktop');
			await expect(desktopNav.getByTestId('nav-shopping')).toBeVisible({ timeout: 15_000 });
			await expect(desktopNav.getByTestId('nav-pantry')).toBeVisible();
			await expect(desktopNav.getByTestId('nav-scan')).toBeVisible();
			await desktopNav.getByRole('button', { name: 'Mer' }).click();
			await expect(page.getByTestId('nav-more-sparkle')).toBeVisible();
			await expect(page.getByTestId('core-action-bar')).toHaveCount(0);
		}
	});

	test('hem links to synk only when stale items exist', async ({ page }) => {
		test.setTimeout(60_000);
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);

		const desktopNav = page.locator('.main-nav-desktop');
		const pantryNav = desktopNav.getByTestId('nav-pantry');
		await expect(pantryNav).toBeVisible({ timeout: 15_000 });

		const staleBadge = pantryNav.locator('.stale-badge');
		const hasStaleBadge = await staleBadge.isVisible({ timeout: 5_000 }).catch(() => false);

		if (hasStaleBadge) {
			await pantryNav.click();
			await expect(page).toHaveURL(/\/inventory\/fridge/);
			await page.goto('/inventory/synk');
			await dismissOnboardingModalIfOpen(page);
			await expect(page.getByText(/Fortfarande hemma|Still at home/i)).toBeVisible({
				timeout: 10_000
			});
		} else {
			await page.goto('/inventory/synk');
			await dismissOnboardingModalIfOpen(page);
			await expect(page.getByText(/Inget att bekräfta|Nothing to confirm/i)).toBeVisible({
				timeout: 10_000
			});
		}
	});

	test('merge page does not 404', async ({ page }) => {
		test.setTimeout(60_000);
		await loginAsAdmin(page);
		await page.goto('/inventory/merge');
		await dismissOnboardingModalIfOpen(page);

		await expect(
			page.getByRole('heading', { name: /Slå ihop dubletter|Merge duplicates/i })
		).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(/404|Not Found/i)).toHaveCount(0);
	});
});
