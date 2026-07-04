import { expect, type Locator, type Page } from '@playwright/test';

/** Home V2 briefing page root — the only /hem layout. */
export function homeSectionLocator(page: Page): Locator {
	return page.locator('.home-v2-page');
}

export async function expectHomeSectionVisible(page: Page) {
	await expect(homeSectionLocator(page)).toBeVisible();
}

export async function expectHomeDashboardVisible(page: Page) {
	await expect(homeSectionLocator(page)).toBeVisible();
	await expect(page.getByTestId('home-v2-briefing')).toBeVisible();
}
