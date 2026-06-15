import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as setup } from '@playwright/test';
import { adminCredentials, loginWithCredentials } from './helpers/auth';

const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '.auth');
const authFile = path.join(authDir, 'admin.json');

setup('authenticate as admin', async ({ page }) => {
	setup.setTimeout(90_000);
	mkdirSync(authDir, { recursive: true });
	const { email, password } = adminCredentials();
	await loginWithCredentials(page, email, password);
	await page.context().storageState({ path: authFile });
});
