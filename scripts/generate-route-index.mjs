/**
 * Generate docs/generated/route-index.md from src/routes filesystem scan.
 * Run: npm run generate:route-index
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAppRoutes } from './lib/route-paths.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'docs', 'generated', 'route-index.md');

const routes = discoverAppRoutes(root);
const sorted = [...routes.entries()].sort(([a], [b]) => a.localeCompare(b));

const pageRoutes = sorted.filter(([, m]) => m.hasPage);
const serverOnlyRoutes = sorted.filter(([, m]) => !m.hasPage && (m.hasPageServer || m.hasServer));
const apiRoutes = sorted.filter(([url]) => url.startsWith('/api/'));

const lines = [
	'<!-- AUTO-GENERATED — do not edit. Run: npm run generate:route-index -->',
	'',
	`# Route index`,
	'',
	`Generated ${new Date().toISOString().slice(0, 10)} from \`src/routes/**\`.`,
	'',
	'Curated feature mapping: [CODEBASE_MAP.md](../CODEBASE_MAP.md). CI manifest: [codebase-map.manifest.json](../codebase-map.manifest.json).',
	'',
	`## Summary`,
	'',
	`| Metric | Count |`,
	'|--------|-------|',
	`| Total route endpoints | ${sorted.length} |`,
	`| With +page.svelte | ${pageRoutes.length} |`,
	`| Server-only (+page.server / +server) | ${serverOnlyRoutes.length} |`,
	`| /api/* | ${apiRoutes.length} |`,
	'',
	'## User-facing pages (+page.svelte)',
	'',
	'| Route | Route dir |',
	'|-------|-----------|'
];

for (const [url, meta] of pageRoutes) {
	lines.push(`| \`${url}\` | \`${meta.routeDir}\` |`);
}

lines.push('', '## Server-only routes (no +page.svelte)', '', '| Route | Files | Route dir |', '|-------|-------|-----------|');

for (const [url, meta] of serverOnlyRoutes) {
	const files = [
		meta.hasPageServer ? '+page.server.ts' : null,
		meta.hasServer ? '+server.ts' : null
	]
		.filter(Boolean)
		.join(', ');
	lines.push(`| \`${url}\` | ${files} | \`${meta.routeDir}\` |`);
}

lines.push('', '## API routes (/api/*)', '', '| Route | Route dir |', '|-------|-----------|');

for (const [url, meta] of apiRoutes) {
	lines.push(`| \`${url}\` | \`${meta.routeDir}\` |`);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outPath} (${sorted.length} routes).`);
