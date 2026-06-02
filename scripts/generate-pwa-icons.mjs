/**
 * Rasterize static/pwa/icon.svg to PNG sizes for PWA + iOS home screen.
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install -D sharp
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'static/pwa/icon.svg');
const outDir = join(root, 'static/pwa');

const sizes = [
	{ name: 'icon-192.png', size: 192 },
	{ name: 'icon-512.png', size: 512 },
	{ name: 'apple-touch-icon.png', size: 180 }
];

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('Install sharp first: npm install -D sharp');
	process.exit(1);
}

const svg = readFileSync(svgPath);

for (const { name, size } of sizes) {
	const outPath = join(outDir, name);
	await sharp(svg, { density: 300 })
		.resize(size, size, { fit: 'contain', background: '#3d6b4f' })
		.png({ compressionLevel: 9 })
		.toFile(outPath);
	console.log(`Wrote ${outPath} (${size}x${size})`);
}
