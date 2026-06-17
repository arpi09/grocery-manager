import { expect, type Page } from '@playwright/test';

export async function expectHomeRedesignVisible(page: Page) {
	await expect(page.locator('.home-v5')).toBeVisible();
	await expect(page.getByTestId('home-hero')).toBeVisible();
	await expect(page.getByTestId('home-expiring-card')).toBeVisible();
	await expect(page.getByTestId('home-shopping-card')).toBeVisible();
	await expect(page.getByTestId('home-pantry-card')).toBeVisible();
	await expect(page.getByTestId('home-household-card')).toBeVisible();
}

export async function expectHomeDashboardVisible(page: Page) {
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
