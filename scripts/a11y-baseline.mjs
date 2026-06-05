/**
 * One-off baseline axe audit for docs/ACCESSIBILITY.md.
 * Usage: node scripts/a11y-baseline.mjs
 * Requires dev server on PLAYWRIGHT_PORT (default 5190) or PLAYWRIGHT_BASE_URL.
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, existsSync } from 'node:fs';

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

const port = process.env.PLAYWRIGHT_PORT ?? '5190';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const tags = ['wcag2a', 'wcag2aa', 'wcag22aa'];

const routes = [
	{ priority: 'P0', path: '/', auth: false },
	{ priority: 'P0', path: '/login', auth: false },
	{ priority: 'P0', path: '/register', auth: false },
	{ priority: 'P0', path: '/hem', auth: true },
	{ priority: 'P0', path: '/inventory/fridge', auth: true },
	{ priority: 'P0', path: '/scan', auth: true },
	{ priority: 'P0', path: '/inkop', auth: true },
	{ priority: 'P1', path: '/settings', auth: true },
	{ priority: 'P1', path: '/planer', auth: true },
	{ priority: 'P1', path: '/statistik', auth: true },
	{ priority: 'P1', path: '/priser', auth: false },
	{ priority: 'P1', path: '/verify-email', auth: false },
	{ priority: 'P2', path: '/admin', auth: true }
];

async function login(page) {
	const email = process.env.E2E_ADMIN_EMAIL?.trim() || 'e2e-admin@example.com';
	const password = process.env.E2E_ADMIN_PASSWORD?.trim() || process.env.ADMIN_PASSWORD?.trim() || 'e2e-ci-password';
	const response = await page.request.post(`${baseURL}/login?/login`, {
		form: { email, password },
		headers: { accept: 'application/json', 'x-sveltekit-action': 'true' },
		maxRedirects: 0
	});
	if (response.status() === 200) {
		const result = await response.json();
		if (result?.type === 'redirect') {
			await page.goto(result.location ?? '/hem');
			return;
		}
	}
	if (response.status() === 302 || response.status() === 303) {
		const location = response.headers()['location'] ?? '/hem';
		await page.goto(location.startsWith('http') ? location : `${baseURL}${location}`);
		return;
	}
	throw new Error(`Login failed: HTTP ${response.status()}`);
}

async function dismissOverlays(page) {
	const cookie = page.locator('[aria-labelledby="cookie-consent-title"]');
	if (await cookie.isVisible().catch(() => false)) {
		await page.getByRole('button', { name: /Endast nödvändiga|Godkänn/i }).first().click({ force: true });
	}
	for (let i = 0; i < 5; i++) {
		const modal = page.locator('.modal-root').first();
		if (!(await modal.isVisible().catch(() => false))) break;
		const skip = page.getByRole('button', { name: /Hoppa över|Skip|Inte nu|Not now/i }).first();
		if (await skip.isVisible().catch(() => false)) {
			await skip.click({ force: true });
		} else {
			await page.keyboard.press('Escape');
		}
		await page.waitForTimeout(300);
	}
}

function countByImpact(violations) {
	const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
	for (const v of violations) {
		const impact = v.impact ?? 'minor';
		if (impact in counts) counts[impact]++;
	}
	return counts;
}

const browser = await chromium.launch();
const context = await browser.newContext({ baseURL, locale: 'sv-SE', viewport: { width: 1400, height: 900 } });
const page = await context.newPage();
let loggedIn = false;

console.log(`Baseline axe audit @ ${baseURL}\n`);
console.log('| Priority | Route | Critical | Serious | Moderate | Minor |');
console.log('|----------|-------|----------|---------|----------|-------|');

for (const route of routes) {
	if (route.auth && !loggedIn) {
		await login(page);
		loggedIn = true;
		await dismissOverlays(page);
	} else if (!route.auth) {
		loggedIn = false;
	}

	await page.goto(route.path, { waitUntil: 'domcontentloaded' });
	await dismissOverlays(page);
	await page.waitForTimeout(500);

	const results = await new AxeBuilder({ page }).withTags(tags).analyze();
	const counts = countByImpact(results.violations);
	console.log(
		`| ${route.priority} | ${route.path} | ${counts.critical} | ${counts.serious} | ${counts.moderate} | ${counts.minor} |`
	);
	if (counts.critical + counts.serious > 0) {
		for (const v of results.violations.filter((x) => x.impact === 'critical' || x.impact === 'serious')) {
			console.log(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
		}
	}
}

await browser.close();
