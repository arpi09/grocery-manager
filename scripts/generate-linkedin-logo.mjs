/**
 * Generate LinkedIn company page logo (300×300).
 * Solid green square — avoids black/white corner artifacts from rounded PWA icons.
 * Run: npm run generate:linkedin-logo
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'static/linkedin');
const size = 300;
const PRIMARY = '#3d6b4f';

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('Install sharp first: npm install -D sharp');
	process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const faviconSvg = readFileSync(join(root, 'static/favicon.svg'));
const outPath = join(outDir, 'logo-300.png');

// Same green behind rounded rect corners — entire canvas reads as solid brand green.
await sharp(faviconSvg, { density: 300 })
	.resize(size, size, { fit: 'contain', background: PRIMARY })
	.flatten({ background: PRIMARY })
	.png({ compressionLevel: 9 })
	.toFile(outPath);

console.log(`Wrote ${outPath} (${size}x${size}, background ${PRIMARY})`);
