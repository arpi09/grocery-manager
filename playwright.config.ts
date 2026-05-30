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

const port = process.env.PLAYWRIGHT_PORT ?? '5173';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL,
		locale: 'sv-SE',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: process.env.CI ? `node build` : `npm run dev -- --port ${port}`,
		url: `${baseURL}/login`,
		reuseExistingServer: !process.env.CI,
		timeout: process.env.CI ? 60_000 : 120_000,
		env: {
			...process.env,
			PORT: port,
			HOST: '0.0.0.0',
			USE_PGLITE: process.env.USE_PGLITE ?? 'true',
			ORIGIN: baseURL,
			PUBLIC_ORIGIN: baseURL,
			TURNSTILE_SKIP: process.env.TURNSTILE_SKIP ?? 'true'
		}
	}
});
