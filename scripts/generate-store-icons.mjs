/**
 * App Store + Play Store icon assets from static/favicon.svg.
 * Run: node scripts/generate-store-icons.mjs
 * Requires: sharp (devDependency)
 *
 * Outputs:
 * - static/store/icon-1024.png — App Store (no alpha, 1024×1024)
 * - static/store/adaptive-foreground-432.png — Android adaptive icon foreground base
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'static/favicon.svg');
const outDir = join(root, 'static/store');

const outputs = [
	{ name: 'icon-1024.png', size: 1024, flattenAlpha: true },
	{ name: 'adaptive-foreground-432.png', size: 432, flattenAlpha: false }
];

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('Install sharp first: npm install -D sharp');
	process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const svg = readFileSync(svgPath);
const brandBg = '#2c4a3e';

for (const { name, size, flattenAlpha } of outputs) {
	const outPath = join(outDir, name);
	let pipeline = sharp(svg, { density: 300 }).resize(size, size, {
		fit: 'contain',
		background: brandBg
	});

	if (flattenAlpha) {
		pipeline = pipeline.flatten({ background: brandBg });
	}

	await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
	console.log(`Wrote ${outPath} (${size}x${size})`);
}

console.log('\nNext: upload icon-1024.png to App Store Connect; use adaptive-foreground-432.png in Android Studio.');
