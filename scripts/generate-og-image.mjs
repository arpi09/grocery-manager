/**
 * Rasterize static/og-skaffu.svg to PNG for LinkedIn / Twitter OG previews.
 * LinkedIn does not render SVG og:image — use 1200×630 PNG (≈1200×627 recommended).
 * Run: node scripts/generate-og-image.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'static/og-skaffu.svg');
const outPath = join(root, 'static/og-skaffu.png');
const width = 1200;
const height = 630;

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('Install sharp first: npm install -D sharp');
	process.exit(1);
}

const svg = readFileSync(svgPath);

await sharp(svg, { density: 150 })
	.resize(width, height, { fit: 'fill' })
	.png({ compressionLevel: 9 })
	.toFile(outPath);

console.log(`Wrote ${outPath} (${width}x${height})`);
