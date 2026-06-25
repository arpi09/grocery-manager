/**
 * Orchestrator for npm run design:build
 */
import { exportTokens } from './export-tokens.ts';
import { copyBrandDoc } from './copy-brand.ts';
import { generateAnimationsDoc } from './generate-animations.ts';
import { generateAiContext } from './generate-ai-context.ts';
import { buildFlowGallery } from './build-flow-gallery.ts';
import { buildComponentGallery } from './build-component-gallery.ts';
import { verifyIllustrations } from './verify-illustrations.ts';
import { captureScreenshots } from './capture-screenshots.ts';
import { validateAssets, printValidationReport } from './validate-assets.ts';
import { existsSync } from 'node:fs';

const skipScreenshots = process.argv.includes('--no-screenshots') || process.env.DESIGN_KIT_NO_SCREENSHOTS === 'true';

async function main(): Promise<void> {
	console.log('Design kit build starting…\n');

	// Docs that don't need server
	exportTokens();
	copyBrandDoc();
	generateAnimationsDoc();
	generateAiContext();
	buildFlowGallery();
	verifyIllustrations();

	if (!skipScreenshots) {
		await captureScreenshots();
	} else {
		console.log('Skipping screenshots (--no-screenshots)');
	}

	const authStorage = existsSync('e2e/.auth/admin.json') ? 'e2e/.auth/admin.json' : undefined;
	await buildComponentGallery({ skipScreenshots: skipScreenshots, authStorage });

	const result = validateAssets();
	printValidationReport(result);

	if (!result.ok && result.missingDocs.length > 0) {
		process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
