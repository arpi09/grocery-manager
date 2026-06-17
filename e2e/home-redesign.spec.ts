import { test } from '@playwright/test';
import { dismissOnboardingModalIfOpen, loginAsAdmin } from './helpers/auth';
import { expectHomeRedesignVisible } from './helpers/home';

test.describe('Home redesign v1', () => {
	test('shows v5 dashboard with hero when flag is on @deploy-critical', async ({ page }) => {
		await loginAsAdmin(page);
		await page.goto('/hem');
		await dismissOnboardingModalIfOpen(page);
		await expectHomeRedesignVisible(page);
	});
});
