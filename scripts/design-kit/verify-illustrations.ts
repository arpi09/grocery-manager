/**
 * Verify illustration assets referenced by the design kit exist.
 */
import { copyFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ILLUSTRATIONS_DIR, ROOT, generatedHeader, ensureDir, isDirectScriptRun } from './shared.ts';

const STATIC_ILLUSTRATIONS = join(ROOT, 'static/illustrations/v2');

export function verifyIllustrations(): { ok: boolean; missing: string[] } {
	ensureDir(ILLUSTRATIONS_DIR);

	const expected = readdirSync(STATIC_ILLUSTRATIONS).filter((f) => f.endsWith('.svg'));
	const missing: string[] = [];

	for (const file of expected) {
		const src = join(STATIC_ILLUSTRATIONS, file);
		const dest = join(ILLUSTRATIONS_DIR, file);
		if (!existsSync(src)) {
			missing.push(src);
			continue;
		}
		copyFileSync(src, dest);
	}

	const manifest = [
		generatedHeader('scripts/design-kit/verify-illustrations.ts'),
		'# Illustrations',
		'',
		'> Copied from `static/illustrations/v2/` on each `design:build`. Do not edit here.',
		'',
		'| File | Usage |',
		'|------|-------|',
		'| `home-hero.svg` | Home briefing hero |',
		'| `shopping-plan.svg` | Inköp plan mode |',
		'| `shopping-trip.svg` | Inköp shop mode |',
		'| `pantry-shelf.svg` | Pantry shelf empty states |',
		'| `for-you.svg` | Home for-you card |',
		'',
		'## Files',
		''
	];

	for (const file of expected) {
		manifest.push(`- [${file}](./${file})`);
	}

	if (missing.length) {
		manifest.push('', '## Missing', '');
		for (const m of missing) {
			manifest.push(`- \`${m}\``);
		}
	}

	writeFileSync(join(ILLUSTRATIONS_DIR, 'README.md'), manifest.join('\n') + '\n', 'utf8');
	console.log(`Synced ${expected.length - missing.length} illustrations to design/ILLUSTRATIONS/`);

	return { ok: missing.length === 0, missing };
}

if (isDirectScriptRun()) {
	const result = verifyIllustrations();
	if (!result.ok) {
		console.error('Missing illustrations:', result.missing);
		process.exit(1);
	}
}
