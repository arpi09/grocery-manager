/**
 * Build design/COMPONENTS/ gallery from /brand page + metadata.
 * Screenshots require running dev server — skipped when unavailable.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import {
	COMPONENTS_DIR,
	MOBILE_VIEWPORT,
	SCREENSHOTS_DIR,
	generatedHeader,
	ensureDir,
	getBaseUrl,
	isServerUp,
	isDirectScriptRun
} from './shared.ts';

export interface ComponentEntry {
	id: string;
	name: string;
	category: string;
	sourceFile: string;
	brandSelector?: string;
	route?: string;
	waitFor?: string;
}

export const COMPONENT_CATALOG: ComponentEntry[] = [
	{ id: 'buttons-primary', name: 'Button — primary', category: 'buttons', sourceFile: 'src/lib/components/atoms/Button.svelte', brandSelector: '.gallery-row:first-child' },
	{ id: 'buttons-secondary', name: 'Button — secondary', category: 'buttons', sourceFile: 'src/lib/components/atoms/Button.svelte', brandSelector: '.gallery-row:first-child' },
	{ id: 'badges', name: 'Badge & LearningAiBadge', category: 'badges', sourceFile: 'src/lib/components/atoms/Badge.svelte', brandSelector: '.gallery-row.badges' },
	{ id: 'banners', name: 'FeedbackBanner (success/warning/error)', category: 'states', sourceFile: 'src/lib/components/molecules/FeedbackBanner.svelte', brandSelector: '.gallery .gallery-row.badges ~ :global(.feedback-banner), .gallery' },
	{ id: 'location-chips', name: 'Location chips (kyl/frys/skafferi)', category: 'chips', sourceFile: 'src/app.css', brandSelector: '.gallery-row.locations' },
	{ id: 'cards-brand', name: 'Brand panel cards', category: 'cards', sourceFile: 'src/routes/brand/+page.svelte', brandSelector: '.panel:nth-of-type(2)' },
	{ id: 'typography', name: 'Typography scale', category: 'typography', sourceFile: 'src/lib/design/brand/typography.ts', brandSelector: 'section.panel:has(.type-samples)' },
	{ id: 'nav-app', name: 'Bottom navigation', category: 'nav', sourceFile: 'src/lib/components/organisms/AppNav.svelte', route: '/hem', waitFor: 'nav[aria-label*="Prim"]' },
	{ id: 'empty-state', name: 'EmptyState', category: 'states', sourceFile: 'src/lib/components/molecules/EmptyState.svelte', route: '/inventory', waitFor: '[data-testid="pantry-v2-empty"], [data-testid="pantry-v2-page"]' },
	{ id: 'illustrations-home', name: 'Home hero illustration', category: 'illustrations', sourceFile: 'static/illustrations/v2/home-hero.svg', route: '/hem', waitFor: 'section.home, section.home-v5, .home-v2-page' }
];

async function captureBrandSections(baseURL: string): Promise<Map<string, string>> {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({ viewport: MOBILE_VIEWPORT, locale: 'sv-SE' });
	const page = await context.newPage();
	const captured = new Map<string, string>();

	await page.goto(`${baseURL}/brand`, { waitUntil: 'networkidle', timeout: 60_000 });

	for (const entry of COMPONENT_CATALOG.filter((c) => c.brandSelector)) {
		const selector = entry.brandSelector!;
		const locator = page.locator(selector).first();
		if (await locator.isVisible().catch(() => false)) {
			const outPath = join(COMPONENTS_DIR, `${entry.id}.png`);
			await locator.screenshot({ path: outPath });
			captured.set(entry.id, outPath);
		}
	}

	await browser.close();
	return captured;
}

async function captureRouteComponents(baseURL: string, authStorage?: string): Promise<void> {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		viewport: MOBILE_VIEWPORT,
		locale: 'sv-SE',
		storageState: authStorage
	});
	const page = await context.newPage();

	for (const entry of COMPONENT_CATALOG.filter((c) => c.route && !c.brandSelector)) {
		if (!entry.route) continue;
		await page.goto(`${baseURL}${entry.route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
		if (entry.waitFor) {
			await page.locator(entry.waitFor).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
		}
		const outPath = join(COMPONENTS_DIR, `${entry.id}.png`);
		await page.screenshot({ path: outPath, fullPage: false });
	}

	await browser.close();
}

function renderIndex(captured: Set<string>): void {
	const lines = [
		generatedHeader('scripts/design-kit/build-component-gallery.ts'),
		'# Component gallery',
		'',
		'Reference screenshots for AI design tools. Live gallery: [`/brand`](/brand).',
		'',
		'| Component | Category | Source | Screenshot |',
		'|-----------|----------|--------|------------|'
	];

	for (const entry of COMPONENT_CATALOG) {
		const shot = captured.has(entry.id) ? `[${entry.id}.png](./${entry.id}.png)` : '_(capture pending)_';
		lines.push(`| ${entry.name} | ${entry.category} | \`${entry.sourceFile}\` | ${shot} |`);
	}

	lines.push('', 'Regenerate: `npm run design:build`.', '');
	writeFileSync(join(COMPONENTS_DIR, 'index.md'), lines.join('\n'), 'utf8');
}

export async function buildComponentGallery(options: { skipScreenshots?: boolean; authStorage?: string } = {}): Promise<void> {
	ensureDir(COMPONENTS_DIR);
	const captured = new Set<string>();
	const baseURL = getBaseUrl();

	if (!options.skipScreenshots && (await isServerUp(baseURL))) {
		const brandShots = await captureBrandSections(baseURL);
		for (const id of brandShots.keys()) {
			captured.add(id);
		}
		await captureRouteComponents(baseURL, options.authStorage);
		for (const entry of COMPONENT_CATALOG.filter((c) => c.route && !c.brandSelector)) {
			captured.add(entry.id);
		}
		console.log(`Captured ${captured.size} component screenshots`);
	} else if (!options.skipScreenshots) {
		console.warn('Dev server unavailable — component screenshots skipped');
	}

	renderIndex(captured);
	console.log('Wrote design/COMPONENTS/index.md');
}

if (isDirectScriptRun()) {
	buildComponentGallery().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
