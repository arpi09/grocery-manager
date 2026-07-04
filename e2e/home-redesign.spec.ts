import { test } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { expectHomeRedesignVisible } from './helpers/home';

test.describe('Home redesign v1', () => {
	test('shows v5 dashboard with hero when flag is on @deploy-critical', async ({ page }) => {
		test.skip(
			process.env.HOME_UX_V2_ENABLED === 'true',
			'Home V2 briefing replaces v1 redesign when HOME_UX_V2_ENABLED=true — covered by home-v2.spec.ts'
		);
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		await expectHomeRedesignVisible(page);
	});
});
