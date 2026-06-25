/**
 * Copy docs/BRAND.md → design/BRAND.md with generated header.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESIGN_DIR, DOCS_BRAND, generatedHeader, ensureDir, isDirectScriptRun } from './shared.ts';

export function copyBrandDoc(): void {
	ensureDir(DESIGN_DIR);
	const source = readFileSync(DOCS_BRAND, 'utf8');
	const content =
		generatedHeader('docs/BRAND.md (copied on design:build)') +
		'> Canonical source: [`docs/BRAND.md`](../docs/BRAND.md). Edit there — this file is regenerated.\n\n' +
		source;
	writeFileSync(join(DESIGN_DIR, 'BRAND.md'), content, 'utf8');
	console.log('Wrote design/BRAND.md');
}

if (isDirectScriptRun()) {
	copyBrandDoc();
}
