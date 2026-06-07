import { defineConfig, devices } from '@playwright/test';

function pickEnv(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

const baseURL =
	pickEnv(process.env.PLAYWRIGHT_BASE_URL) ??
	pickEnv(process.env.BASE_URL) ??
	'https://skaffu.com';

const adminEmail =
	pickEnv(process.env.SMOKE_ADMIN_EMAIL) ??
	pickEnv(process.env.E2E_ADMIN_EMAIL) ??
	pickEnv(process.env.ADMIN_EMAIL);
const adminPassword =
	pickEnv(process.env.SMOKE_ADMIN_PASSWORD) ??
	pickEnv(process.env.E2E_ADMIN_PASSWORD) ??
	pickEnv(process.env.ADMIN_PASSWORD);

if (adminEmail) {
	process.env.ADMIN_EMAIL = adminEmail;
	process.env.E2E_ADMIN_EMAIL = adminEmail;
}
if (adminPassword) {
	process.env.ADMIN_PASSWORD = adminPassword;
	process.env.E2E_ADMIN_PASSWORD = adminPassword;
}

process.env.PLAYWRIGHT_BASE_URL = baseURL;

/** Prod smoke only — no local webServer; hits live PRODUCTION_URL. */
export default defineConfig({
	testDir: 'e2e',
	testMatch: 'smoke-prod-auth.spec.ts',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI ? 'github' : 'list',
	timeout: 90_000,
	use: {
		baseURL,
		locale: 'sv-SE',
		viewport: { width: 1400, height: 900 },
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		actionTimeout: 15_000,
		navigationTimeout: 60_000
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
