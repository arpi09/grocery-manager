import { test, expect } from '@playwright/test';

import { registerNewUser, dismissOnboardingModalIfOpen } from './helpers/auth';

test('tmp: audit scan receipt page spacing on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await registerNewUser(page);
	await dismissOnboardingModalIfOpen(page);
	await page.goto('/scan?mode=receipt');
	await expect(page.locator('.lead')).toBeVisible({ timeout: 15_000 });

	const audit = await page.evaluate(() => {
		const tabs = document.querySelector('.mode-tabs');
		const lead = document.querySelector('.lead');
		const container = document.querySelector('.page-container');
		if (!tabs || !lead || !container) return { error: 'elements missing' };
		const t = tabs.getBoundingClientRect();
		const l = lead.getBoundingClientRect();
		return {
			gapTabsToLead: Math.round(l.top - t.bottom),
			pageSectionGap: getComputedStyle(container).gap,
			children: [...container.children].map((c) => ({
				cls: (c.className || c.tagName).toString().slice(0, 50),
				h: Math.round(c.getBoundingClientRect().height)
			}))
		};
	});
	console.log('SCAN_AUDIT', JSON.stringify(audit, null, 2));
	await page.screenshot({ path: 'e2e/.artifacts/tmp-scan-receipt-mobile.png', fullPage: true });
});
