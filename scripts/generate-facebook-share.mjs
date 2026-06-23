/**
 * Generate Facebook link/post share images (1200×630).
 * Same visual language as OG — themed variants for manual posts.
 * Run: npm run generate:facebook-share
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	COLORS,
	COVER_SLIDES,
	FONT,
	SUBTITLE_WEIGHT,
	buildOgSvgBody,
	escapeXml,
	OG_MARK_SIZE,
	renderTitleElement,
	wrapSvgWithFonts
} from './social-brand.mjs';
import { writeSvgAsPng } from './social-render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'static/facebook');

const width = 1200;
const height = 630;

/** @type {{ file: string; title: string; subtitle: string; tagline?: string; showPill?: boolean }[]} */
const slides = [
	{
		file: 'share-hero.png',
		title: 'Skaffu',
		subtitle: 'Handla ihop med koll på skafferiet',
		tagline: 'Delad lista · utgångsdatum · mindre matsvinn',
		showPill: true
	},
	...COVER_SLIDES.filter((slide) => slide.fileSuffix !== 'hero').map((slide) => ({
		file: `share-${slide.fileSuffix}.png`,
		title: slide.title,
		subtitle: slide.subtitle,
		showPill: slide.showPill
	}))
];

/**
 * @param {string} title
 * @param {string} subtitle
 * @param {string | undefined} tagline
 * @param {boolean} showPill
 */
function buildSvg(title, subtitle, tagline, showPill) {
	if (tagline) {
		return wrapSvgWithFonts(
			buildOgSvgBody({ title, subtitle, tagline, showPill }),
			width,
			height,
			`role="img" aria-label="${escapeXml(title)}"`
		);
	}

	const titleSize = title === 'Skaffu' ? 88 : title.length > 24 ? 56 : title.length > 18 ? 64 : 72;
	const titleY = 260;
	const markY = titleY - OG_MARK_SIZE;
	const subtitleY = title === 'Skaffu' ? 360 : 340;
	const subtitleSize = 36;
	const pillY = 460;

	const titleElement = renderTitleElement(title, {
		x: 96,
		y: title === 'Skaffu' ? markY : titleY,
		fontSize: titleSize
	});

	const pill =
		showPill ?
			`<rect x="96" y="${pillY}" width="280" height="56" rx="12" fill="${COLORS.primary}"/>
  <text x="236" y="${pillY + 36}" fill="${COLORS.white}" font-family="${FONT}" font-size="24" font-weight="${SUBTITLE_WEIGHT}" text-anchor="middle">skaffu.com</text>`
		:	'';

	const body = `<defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.bgStart}"/>
      <stop offset="100%" stop-color="${COLORS.bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="180" fill="${COLORS.primary}" opacity="0.08"/>
  <circle cx="180" cy="520" r="220" fill="${COLORS.primary}" opacity="0.06"/>
  ${titleElement}
  <text x="96" y="${subtitleY}" fill="${COLORS.subtitle}" font-family="${FONT}" font-size="${subtitleSize}" font-weight="${SUBTITLE_WEIGHT}">${escapeXml(subtitle)}</text>
  ${pill}`;

	return wrapSvgWithFonts(body, width, height, `role="img" aria-label="${escapeXml(title)}"`);
}

mkdirSync(outDir, { recursive: true });

const generated = [];

for (const slide of slides) {
	const svg = buildSvg(slide.title, slide.subtitle, slide.tagline, slide.showPill ?? false);
	const outPath = join(outDir, slide.file);

	writeSvgAsPng(svg, width, height, outPath);

	generated.push(outPath);
	console.log(`Wrote ${outPath} (${width}x${height})`);
}

console.log(`\nGenerated ${generated.length} share images in static/facebook/`);
