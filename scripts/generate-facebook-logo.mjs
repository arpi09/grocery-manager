/**
 * Generate Facebook Page profile picture (320×320).
 * Run: npm run generate:facebook-logo
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSocialLogo } from './social-logo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

await generateSocialLogo({
	outDir: join(root, 'static/facebook'),
	size: 320,
	outFilename: 'profile-320.png'
});
