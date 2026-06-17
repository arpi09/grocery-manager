import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

function loadDotEnv(path = '.env') {
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim();
		if (process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

loadDotEnv();

/** Dedicated port so E2E does not collide with a running `npm run dev` on 5173. */
const port = process.env.PLAYWRIGHT_PORT ?? '5190';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
process.env.PLAYWRIGHT_BASE_URL = baseURL;
const turnstileBypass = process.env.TURNSTILE_BYPASS ?? process.env.TURNSTILE_SKIP ?? 'true';

function pickEnv(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}
const e2eAdminEmail = pickEnv(process.env.E2E_ADMIN_EMAIL) ?? 'e2e-admin@example.com';
const e2eAdminPassword = pickEnv(process.env.E2E_ADMIN_PASSWORD) ?? 'e2e-ci-password';

process.env.ADMIN_EMAIL = e2eAdminEmail;
process.env.ADMIN_PASSWORD = e2eAdminPassword;

const adminStorageState = 'e2e/.auth/admin.json';
const freshUserSpecs = [/critical-flows\.spec\.ts/, /growth-wave\.spec\.ts/];

/** iPhone 14 viewport (390×844) in Chromium — avoids WebKit dependency in CI. */
const mobileChrome = {
	...devices['Desktop Chrome'],
	viewport: { width: 390, height: 844 },
	isMobile: true,
	hasTouch: true,
	deviceScaleFactor: 3
};

export default defineConfig({
	globalSetup: './e2e/global-setup.ts',
	testDir: 'e2e',
	/** Vitest unit tests under e2e/helpers must not be collected by Playwright. */
	testMatch: '**/*.spec.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : 1,
	reporter: process.env.CI ? 'github' : 'list',
	timeout: process.env.CI ? 60_000 : 30_000,
	use: {
		baseURL,
		locale: 'sv-SE',
		viewport: { width: 1400, height: 900 },
		trace: 'retain-on-failure',
		video: 'off',
		screenshot: 'only-on-failure',
		actionTimeout: 15_000,
		navigationTimeout: process.env.CI ? 60_000 : 30_000
	},
	projects: [
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/
		},
		{
			name: 'chromium',
			testIgnore: [/mobile-visual\.spec\.ts/, /auth\.setup\.ts/, ...freshUserSpecs],
			use: { ...devices['Desktop Chrome'], storageState: adminStorageState },
			dependencies: ['setup']
		},
		{
			name: 'chromium-fresh',
			testMatch: freshUserSpecs,
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'mobile-chrome',
			testMatch: /mobile-visual\.spec\.ts/,
			use: { ...mobileChrome, storageState: adminStorageState },
			dependencies: ['setup']
		}
	],
	webServer: {
		command: `npx svelte-kit sync && npm run dev -- --port ${port}`,
		url: `${baseURL}/login`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
		env: {
			...process.env,
			USE_PGLITE: process.env.USE_PGLITE ?? 'true',
			PUBLIC_ORIGIN: baseURL,
			ADMIN_EMAIL: e2eAdminEmail,
			ADMIN_PASSWORD: e2eAdminPassword,
			TURNSTILE_SKIP: turnstileBypass,
			TURNSTILE_BYPASS: turnstileBypass,
			EMAIL_VERIFICATION_SKIP: process.env.EMAIL_VERIFICATION_SKIP ?? 'true',
			E2E_MOCK_AI: process.env.E2E_MOCK_AI ?? 'true',
			PUBLIC_E2E_DISABLE_POST_SURVEY: 'true',
			HOME_REDESIGN_V1_ENABLED: process.env.HOME_REDESIGN_V1_ENABLED ?? 'true'
		}
	}
});
