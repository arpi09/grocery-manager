import { expect, type Locator, type Page } from '@playwright/test';

/** Legacy `.home`, redesign `.home-v5`, or v2 briefing — matches whichever dashboard is active. */
export function homeSectionLocator(page: Page): Locator {
	return page.locator('section.home-v5, section.home, [data-testid="home-v2-page"]');
}

export async function expectHomeSectionVisible(page: Page) {
	await expect(homeSectionLocator(page)).toBeVisible();
}

export async function expectHomeRedesignVisible(page: Page) {
	await expect(page.locator('.home-v5')).toBeVisible();
	await expect(page.getByTestId('home-hero')).toBeVisible();
	await expect(page.getByTestId('home-expiring-card')).toBeVisible();
	await expect(page.getByTestId('home-shopping-card')).toBeVisible();
	await expect(page.getByTestId('home-pantry-card')).toBeVisible();
	await expect(page.getByTestId('home-household-card')).toBeVisible();
}

export async function expectHomeDashboardVisible(page: Page) {
	const homeV2 = page.locator('.home-v2-page');
	if ((await homeV2.count()) > 0) {
		await expect(homeV2).toBeVisible();
		await expect(page.getByTestId('home-v2-briefing')).toBeVisible();
		return;
	}

	const redesign = page.locator('.home-v5');
	if ((await redesign.count()) > 0) {
		await expectHomeRedesignVisible(page);
		return;
	}

	await expect(page.getByTestId('home-welcome')).toBeVisible();
	await expect(page.getByTestId('home-card-pantry')).toBeVisible();
	await expect(page.getByTestId('home-card-shopping')).toBeVisible();
	await expect(page.getByTestId('home-card-expiring')).toBeVisible();
}
