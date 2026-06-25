/**
 * Validate design kit assets — screenshots, illustrations, generated docs.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	COMPONENTS_DIR,
	DESIGN_DIR,
	FLOWS_DIR,
	ILLUSTRATIONS_DIR,
	SCREENSHOTS_DIR,
	isDirectScriptRun
} from './shared.ts';

export const REQUIRED_SCREENSHOTS = [
	'home',
	'shopping-plan',
	'shopping-trip',
	'pantry',
	'receipt-review',
	'receipt-upload',
	'receipt-success',
	'store-recommendation',
	'settings',
	'brain',
	'start-guide',
	'error',
	'empty-pantry',
	'empty-shopping',
	'loading',
	'success-states'
] as const;

/** Screenshots that may be absent when feature/UI is not wired. */
export const OPTIONAL_SCREENSHOTS = ['store-recommendation'] as const;

export const REQUIRED_DOCS = [
	'DESIGN.md',
	'BRAND.md',
	'UX_PRINCIPLES.md',
	'TOKENS.md',
	'ANIMATIONS.md',
	'AI_CONTEXT.md'
];

export interface ValidationResult {
	ok: boolean;
	missingScreenshots: string[];
	missingDocs: string[];
	warnings: string[];
}

export function validateAssets(options: { strictScreenshots?: boolean } = {}): ValidationResult {
	const missingScreenshots: string[] = [];
	const warnings: string[] = [];
	const missingDocs: string[] = [];

	for (const name of REQUIRED_SCREENSHOTS) {
		const path = join(SCREENSHOTS_DIR, `${name}.png`);
		if (!existsSync(path)) {
			if (OPTIONAL_SCREENSHOTS.includes(name as (typeof OPTIONAL_SCREENSHOTS)[number])) {
				warnings.push(`Optional screenshot missing: ${name}.png (no UI surface yet)`);
			} else {
				missingScreenshots.push(name);
			}
		}
	}

	for (const doc of REQUIRED_DOCS) {
		if (!existsSync(join(DESIGN_DIR, doc))) {
			missingDocs.push(doc);
		}
	}

	if (!existsSync(join(FLOWS_DIR, 'index.md'))) {
		missingDocs.push('FLOWS/index.md');
	}
	if (!existsSync(join(COMPONENTS_DIR, 'index.md'))) {
		missingDocs.push('COMPONENTS/index.md');
	}
	if (!existsSync(join(ILLUSTRATIONS_DIR, 'README.md'))) {
		missingDocs.push('ILLUSTRATIONS/README.md');
	}

	const strict = options.strictScreenshots ?? process.env.DESIGN_KIT_STRICT === 'true';
	const ok =
		missingDocs.length === 0 && (strict ? missingScreenshots.length === 0 : missingScreenshots.length <= 3);

	return { ok, missingScreenshots, missingDocs, warnings };
}

export function printValidationReport(result: ValidationResult): void {
	console.log('\n--- Design kit validation ---');
	if (result.missingDocs.length) {
		console.error('Missing docs:', result.missingDocs.join(', '));
	}
	if (result.missingScreenshots.length) {
		console.warn('Missing screenshots:', result.missingScreenshots.join(', '));
	}
	for (const w of result.warnings) {
		console.warn(w);
	}
	if (result.ok) {
		if (result.missingScreenshots.length) {
			console.log('Validation passed (docs complete; screenshot gaps OK without strict mode).');
		} else {
			console.log('Validation passed.');
		}
	} else {
		console.error('Validation failed.');
	}
}

if (isDirectScriptRun()) {
	const result = validateAssets();
	printValidationReport(result);
	process.exit(result.ok ? 0 : 1);
}
