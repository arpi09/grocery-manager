import { defineConfig, devices } from '@playwright/test';

/** Dedicated port so pre-deploy smoke does not collide with dev on 5173. */
const port = process.env.PLAYWRIGHT_PORT ?? '5190';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
process.env.PLAYWRIGHT_BASE_URL = baseURL;

function pickEnv(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

const adminEmail = pickEnv(process.env.E2E_ADMIN_EMAIL) ?? 'e2e-admin@example.com';
const adminPassword = pickEnv(process.env.E2E_ADMIN_PASSWORD) ?? 'e2e-ci-password';

process.env.ADMIN_EMAIL = adminEmail;
process.env.ADMIN_PASSWORD = adminPassword;
process.env.E2E_ADMIN_EMAIL = adminEmail;
process.env.E2E_ADMIN_PASSWORD = adminPassword;

/** Pre-deploy gate — serves the production build artifact locally (PGlite) and hits /hem. */
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
		trace: 'retain-on-failure',
		video: 'off',
		screenshot: 'only-on-failure',
		actionTimeout: 15_000,
		navigationTimeout: 60_000
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: `node build`,
		url: `${baseURL}/login`,
		reuseExistingServer: false,
		timeout: 180_000,
		env: {
			...process.env,
			PORT: port,
			HOST: '127.0.0.1',
			USE_PGLITE: process.env.USE_PGLITE ?? 'true',
			ORIGIN: baseURL,
			PUBLIC_ORIGIN: baseURL,
			ADMIN_EMAIL: adminEmail,
			ADMIN_PASSWORD: adminPassword,
			TURNSTILE_SKIP: process.env.TURNSTILE_SKIP ?? 'true',
			TURNSTILE_BYPASS: process.env.TURNSTILE_BYPASS ?? 'true',
			EMAIL_VERIFICATION_SKIP: process.env.EMAIL_VERIFICATION_SKIP ?? 'true',
			E2E_MOCK_AI: process.env.E2E_MOCK_AI ?? 'true',
			PUBLIC_E2E_DISABLE_POST_SURVEY: 'true'
		}
	}
});
