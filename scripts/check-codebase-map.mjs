/**
 * Verify docs/codebase-map.manifest.json covers every app route.
 * Run: npm run check:codebase-map
 *
 * - FAIL if a filesystem route is missing from the manifest
 * - WARN (exit 0) if a manifest route has no +page.svelte unless apiOnly
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAppRoutes } from './lib/route-paths.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'docs', 'codebase-map.manifest.json');

/** @typedef {{ id: string, routes?: string[], apiOnlyRoutes?: string[] }} Feature */

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
/** @type {Feature[]} */
const features = manifest.features ?? [];

/** @type {Map<string, { apiOnly: boolean, featureId: string }>} */
const manifestRoutes = new Map();

for (const feature of features) {
	for (const route of feature.routes ?? []) {
		manifestRoutes.set(route, { apiOnly: false, featureId: feature.id });
	}
	for (const route of feature.apiOnlyRoutes ?? []) {
		manifestRoutes.set(route, { apiOnly: true, featureId: feature.id });
	}
}

const appRoutes = discoverAppRoutes(root);
const missing = [];
const warnings = [];

for (const [url, meta] of appRoutes) {
	if (!manifestRoutes.has(url)) {
		missing.push({ url, routeDir: meta.routeDir });
	}
}

for (const [url, entry] of manifestRoutes) {
	const meta = appRoutes.get(url);
	if (!meta) {
		warnings.push(`Manifest route \`${url}\` (feature \`${entry.featureId}\`) has no matching filesystem route`);
		continue;
	}
	if (!meta.hasPage && !entry.apiOnly) {
		warnings.push(
			`Route \`${url}\` (feature \`${entry.featureId}\`) has no +page.svelte — set apiOnlyRoutes or add a page`
		);
	}
}

let failed = false;

if (missing.length > 0) {
	failed = true;
	console.error('::error::codebase-map check failed — routes missing from manifest:');
	for (const { url, routeDir } of missing.sort((a, b) => a.url.localeCompare(b.url))) {
		console.error(`  ${url}  (src/routes/${routeDir === '.' ? '' : routeDir})`);
	}
	console.error(`\nAdd missing routes to docs/codebase-map.manifest.json and docs/CODEBASE_MAP.md`);
}

if (warnings.length > 0) {
	console.warn('::warning::codebase-map warnings:');
	for (const msg of warnings.sort()) {
		console.warn(`  ${msg}`);
	}
}

if (failed) {
	process.exit(1);
}

console.log(`codebase-map check passed (${manifestRoutes.size} manifest routes, ${appRoutes.size} app routes).`);
