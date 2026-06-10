/**
 * Generate Facebook link/post share images (1200×630).
 * Same visual language as static/og-skaffu.svg — themed variants for manual posts.
 * Run: npm run generate:facebook-share
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLORS, FONT, escapeXml } from './social-brand.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'static/facebook');

const width = 1200;
const height = 630;

/** @type {{ file: string; title: string; subtitle: string; tagline?: string; showPill?: boolean }[]} */
const slides = [
	{
		file: 'share-hero.png',
		title: 'Skaffu',
		subtitle: 'Skafferi-app för hela hushållet',
		tagline: 'Skanna · följ utgångsdatum · minska matsvinn',
		showPill: true
	},
	{
		file: 'share-01-brand.png',
		title: 'Skaffu',
		subtitle: 'Skafferiet du har koll på',
		showPill: true
	},
	{
		file: 'share-02-scan.png',
		title: 'Skanna det du har hemma',
		subtitle: 'Streckkod, kvitto eller foto'
	},
	{
		file: 'share-03-meal.png',
		title: 'Maträtt på knapptryck',
		subtitle: 'Recept från ditt lager'
	},
	{
		file: 'share-04-waste.png',
		title: 'Ät det som går ut',
		subtitle: 'Mindre matsvinn'
	},
	{
		file: 'share-05-cta.png',
		title: 'Gratis att prova',
		subtitle: 'skaffu.com',
		showPill: true
	}
];

/**
 * @param {string} title
 * @param {string} subtitle
 * @param {string | undefined} tagline
 * @param {boolean} showPill
 */
function buildSvg(title, subtitle, tagline, showPill) {
	const titleSize = title === 'Skaffu' ? 88 : title.length > 24 ? 56 : title.length > 18 ? 64 : 72;
	const titleY = tagline ? 280 : 260;
	const subtitleY = tagline ? 360 : 340;
	const subtitleSize = tagline ? 42 : 36;
	const taglineY = 430;
	const taglineSize = 32;
	const pillY = tagline ? 480 : 460;

	const taglineEl =
		tagline ?
			`<text x="96" y="${taglineY}" fill="${COLORS.subtitle}" font-family="${FONT}" font-size="${taglineSize}" font-weight="400">${escapeXml(tagline)}</text>`
		:	'';

	const pill =
		showPill ?
			`<rect x="96" y="${pillY}" width="280" height="56" rx="12" fill="${COLORS.primary}"/>
  <text x="236" y="${pillY + 36}" fill="${COLORS.white}" font-family="${FONT}" font-size="24" font-weight="600" text-anchor="middle">skaffu.com</text>`
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
  <circle cx="980" cy="120" r="180" fill="${COLORS.primary}" opacity="0.08"/>
  <circle cx="180" cy="520" r="220" fill="${COLORS.primary}" opacity="0.06"/>
  <text x="96" y="${titleY}" fill="${COLORS.title}" font-family="${FONT}" font-size="${titleSize}" font-weight="700">${escapeXml(title)}</text>
  <text x="96" y="${subtitleY}" fill="${COLORS.primary}" font-family="${FONT}" font-size="${subtitleSize}" font-weight="600">${escapeXml(subtitle)}</text>
  ${taglineEl}
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
	const svg = buildSvg(slide.title, slide.subtitle, slide.tagline, slide.showPill ?? false);
	const outPath = join(outDir, slide.file);

	await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);

	generated.push(outPath);
	console.log(`Wrote ${outPath} (${width}x${height})`);
}

console.log(`\nGenerated ${generated.length} share images in static/facebook/`);
