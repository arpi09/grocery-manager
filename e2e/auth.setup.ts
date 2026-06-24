import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as setup } from '@playwright/test';
import {
	adminCredentials,
	dismissPageHintIfOpen,
	dismissPostOnboardingShareIfOpen,
	dismissMobileMoreNavIfOpen,
	loginWithCredentials
} from './helpers/auth';

const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '.auth');
const authFile = path.join(authDir, 'admin.json');

setup('authenticate as admin', async ({ page }) => {
	setup.setTimeout(90_000);
	mkdirSync(authDir, { recursive: true });
	const { email, password } = adminCredentials();
	await loginWithCredentials(page, email, password);
	// Warm /inkop and persist dismissed inkop overlays (share prompt, page hints) in storage state.
	await page.goto('/inkop?sort=added&dir=desc&pageSize=25', {
		waitUntil: 'domcontentloaded',
		timeout: 60_000
	});
	await dismissPostOnboardingShareIfOpen(page);
	await dismissPageHintIfOpen(page);
	await page.locator('#shopping-list-panel').waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
	await page.goto('/planer?week=2026-06-01', { waitUntil: 'domcontentloaded', timeout: 60_000 });
	await dismissPageHintIfOpen(page);
	await dismissMobileMoreNavIfOpen(page);
	await page.context().storageState({ path: authFile });
});
