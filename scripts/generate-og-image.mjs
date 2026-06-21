/**
 * Rasterize OG image to PNG for LinkedIn / Twitter previews.
 * Builds SVG with embedded DM Sans (resvg renders embedded @font-face; Sharp/librsvg does not).
 * Run: npm run generate:og-image
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOgSvg } from './social-brand.mjs';
import { writeSvgAsPng } from './social-render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'static/og-skaffu.svg');
const outPath = join(root, 'static/og-skaffu.png');
const width = 1200;
const height = 630;

const svg = buildOgSvg();
writeFileSync(svgPath, svg, 'utf8');
writeSvgAsPng(svg, width, height, outPath);

console.log(`Wrote ${svgPath}`);
console.log(`Wrote ${outPath} (${width}x${height})`);
