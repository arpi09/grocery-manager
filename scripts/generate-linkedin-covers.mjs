/**
 * Generate LinkedIn company page cover PNGs at 2× (2256×382).
 * LinkedIn minimum is 1128×191; 2× keeps text sharp after platform downscale/crop.
 * Run: npm run generate:linkedin-covers
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	COLORS,
	COVER_SLIDES,
	FONT,
	SUBTITLE_WEIGHT,
	TITLE_WEIGHT,
	escapeXml,
	titleLetterSpacingAttr,
	wrapSvgWithFonts
} from './social-brand.mjs';
import { writeSvgAsPng } from './social-render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'static/linkedin');

/** LinkedIn display minimum; export at 2× for sharper rendering. */
const SCALE = 2;
const width = 1128 * SCALE;
const height = 191 * SCALE;

/** Profile logo overlaps ~220px on the left at 1× display — keep text out of this band. */
const SAFE_LEFT = 220 * SCALE;
const textX = Math.round((SAFE_LEFT + width) / 2);

/**
 * @param {string} title
 * @param {string} subtitle
 * @param {boolean} showPill
 */
function buildSvg(title, subtitle, showPill) {
	const s = SCALE;
	const titleSize =
		title.length > 24 ? 34 * s : title.length > 18 ? 38 * s : title === 'Skaffu' ? 52 * s : 40 * s;
	const titleY = showPill ? 78 * s : 88 * s;
	const subtitleY = titleY + (title === 'Skaffu' ? 42 * s : 38 * s);
	const subtitleSize = 20 * s;
	const pillW = 168 * s;
	const pillH = 36 * s;
	const pillY = 132 * s;

	const pill =
		showPill ?
			`<rect x="${textX - pillW / 2}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${8 * s}" fill="${COLORS.primary}"/>
  <text x="${textX}" y="${pillY + 24 * s}" fill="${COLORS.white}" font-family="${FONT}" font-size="${16 * s}" font-weight="${SUBTITLE_WEIGHT}" text-anchor="middle">skaffu.com</text>`
		:	'';

	const body = `<defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.bgStart}"/>
      <stop offset="100%" stop-color="${COLORS.bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${980 * s}" cy="${28 * s}" r="${72 * s}" fill="${COLORS.primary}" opacity="0.08"/>
  <circle cx="${width - 88 * s}" cy="${height - 40 * s}" r="${72 * s}" fill="${COLORS.primary}" opacity="0.06"/>
  <text x="${textX}" y="${titleY}" fill="${COLORS.title}" font-family="${FONT}" font-size="${titleSize}" font-weight="${TITLE_WEIGHT}"${titleLetterSpacingAttr(title)} text-anchor="middle">${escapeXml(title)}</text>
  <text x="${textX}" y="${subtitleY}" fill="${COLORS.subtitle}" font-family="${FONT}" font-size="${subtitleSize}" font-weight="${SUBTITLE_WEIGHT}" text-anchor="middle">${escapeXml(subtitle)}</text>
  ${pill}`;

	return wrapSvgWithFonts(body, width, height, `role="img" aria-label="${escapeXml(title)}"`);
}

mkdirSync(outDir, { recursive: true });

const generated = [];

for (const slide of COVER_SLIDES) {
	const svg = buildSvg(slide.title, slide.subtitle, slide.showPill ?? false);
	const outPath = join(outDir, `cover-${slide.fileSuffix}.png`);

	writeSvgAsPng(svg, width, height, outPath);

	generated.push(outPath);
	console.log(`Wrote ${outPath} (${width}x${height})`);
}

console.log(`\nGenerated ${generated.length} covers in static/linkedin/`);
