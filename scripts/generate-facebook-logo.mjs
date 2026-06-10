/**
 * Generate Facebook Page profile picture (320×320).
 * Solid green square — avoids black/white corner artifacts from rounded PWA icons.
 * Run: npm run generate:facebook-logo
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY } from './social-brand.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'static/facebook');
const size = 320;

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('Install sharp first: npm install -D sharp');
	process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const faviconSvg = readFileSync(join(root, 'static/favicon.svg'));
const outPath = join(outDir, 'profile-320.png');

await sharp(faviconSvg, { density: 300 })
	.resize(size, size, { fit: 'contain', background: PRIMARY })
	.flatten({ background: PRIMARY })
	.png({ compressionLevel: 9 })
	.toFile(outPath);

console.log(`Wrote ${outPath} (${size}x${size}, background ${PRIMARY})`);
