/**
 * Generate Facebook Page cover PNGs at 2× (1640×720).
 * Facebook safe zone: 820×360 display; profile photo overlaps bottom-left ~200×200 px at 1×.
 * Run: npm run generate:facebook-covers
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLORS, FONT, escapeXml } from './social-brand.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'static/facebook');

const SCALE = 2;
const width = 820 * SCALE;
const height = 360 * SCALE;

/** Text centered in 640×312 safe zone (middle of canvas). */
const textX = width / 2;

/** @type {{ file: string; title: string; subtitle: string; showPill?: boolean }[]} */
const slides = [
	{
		file: 'cover-hero.png',
		title: 'Skaffu',
		subtitle: 'Skafferiet du har koll på',
		showPill: true
	},
	{
		file: 'cover-01-brand.png',
		title: 'Skaffu',
		subtitle: 'Skafferiet du har koll på',
		showPill: true
	},
	{
		file: 'cover-02-scan.png',
		title: 'Skanna det du har hemma',
		subtitle: 'Streckkod, kvitto eller foto'
	},
	{
		file: 'cover-03-meal.png',
		title: 'Maträtt på knapptryck',
		subtitle: 'Recept från ditt lager'
	},
	{
		file: 'cover-04-waste.png',
		title: 'Ät det som går ut',
		subtitle: 'Mindre matsvinn'
	},
	{
		file: 'cover-05-cta.png',
		title: 'Gratis att prova',
		subtitle: 'skaffu.com',
		showPill: true
	}
];

/**
 * @param {string} title
 * @param {string} subtitle
 * @param {boolean} showPill
 */
function buildSvg(title, subtitle, showPill) {
	const s = SCALE;
	const titleSize =
		title.length > 24 ? 34 * s : title.length > 18 ? 38 * s : title === 'Skaffu' ? 52 * s : 40 * s;
	const titleY = showPill ? 280 * s : 300 * s;
	const subtitleY = titleY + (title === 'Skaffu' ? 42 * s : 38 * s);
	const subtitleSize = 20 * s;
	const pillW = 168 * s;
	const pillH = 36 * s;
	const pillY = 340 * s;

	const pill =
		showPill ?
			`<rect x="${textX - pillW / 2}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${8 * s}" fill="${COLORS.primary}"/>
  <text x="${textX}" y="${pillY + 24 * s}" fill="${COLORS.white}" font-family="${FONT}" font-size="${16 * s}" font-weight="600" text-anchor="middle">skaffu.com</text>`
		:	'';

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.bgStart}"/>
      <stop offset="100%" stop-color="${COLORS.bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${980 * s}" cy="${80 * s}" r="${72 * s}" fill="${COLORS.primary}" opacity="0.08"/>
  <circle cx="${width - 88 * s}" cy="${height - 60 * s}" r="${72 * s}" fill="${COLORS.primary}" opacity="0.06"/>
  <text x="${textX}" y="${titleY}" fill="${COLORS.title}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" text-anchor="middle">${escapeXml(title)}</text>
  <text x="${textX}" y="${subtitleY}" fill="${COLORS.subtitle}" font-family="${FONT}" font-size="${subtitleSize}" font-weight="400" text-anchor="middle">${escapeXml(subtitle)}</text>
  ${pill}
</svg>`;
}

let sharp;
try {
	sharp = (await import('sharp')).default;
} catch {
	console.error('Install sharp first: npm install -D sharp');
	process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const generated = [];

for (const slide of slides) {
	const svg = buildSvg(slide.title, slide.subtitle, slide.showPill ?? false);
	const outPath = join(outDir, slide.file);

	await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);

	generated.push(outPath);
	console.log(`Wrote ${outPath} (${width}x${height})`);
}

console.log(`\nGenerated ${generated.length} covers in static/facebook/`);
