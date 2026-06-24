/**
 * Generate LinkedIn company page logo (300×300).
 * Run: npm run generate:linkedin-logo
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSocialLogo } from './social-logo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

await generateSocialLogo({
	outDir: join(root, 'static/linkedin'),
	size: 300,
	outFilename: 'logo-300.png'
});
