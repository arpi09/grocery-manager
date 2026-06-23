/**
 * Generate Facebook Page cover PNGs at 2× (1640×720).
 * Facebook safe zone: 820×360 display; profile photo overlaps bottom-left ~200×200 px at 1×.
 * Run: npm run generate:facebook-covers
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	COLORS,
	FONT,
	SUBTITLE_WEIGHT,
	escapeXml,
	renderTitleElement,
	wrapSvgWithFonts
} from './social-brand.mjs';
import { generateSocialCovers } from './social-cover.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'static/facebook');

const SCALE = 2;
const width = 820 * SCALE;
const height = 360 * SCALE;

/** Text centered in 640×312 safe zone (middle of canvas). */
const textX = width / 2;

/**
 * @param {string} title
 * @param {string} subtitle
 * @param {boolean} showPill
 */
function buildSvg(title, subtitle, showPill) {
	const s = SCALE;
	const markSize = 88 * s;
	const titleSize =
		title.length > 24 ? 34 * s : title.length > 18 ? 38 * s : title === 'Skaffu' ? 52 * s : 40 * s;
	const titleY = showPill ? 280 * s : 300 * s;
	const markY = 200 * s;
	const subtitleY =
		title === 'Skaffu' ? markY + markSize + 16 * s : titleY + 38 * s;
	const subtitleSize = 20 * s;
	const pillW = 168 * s;
	const pillH = 36 * s;
	const pillY = 340 * s;

	const titleElement = renderTitleElement(title, {
		x: textX,
		y: title === 'Skaffu' ? markY : titleY,
		fontSize: titleSize,
		textAnchor: 'middle',
		markSize
	});

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
  <circle cx="${980 * s}" cy="${80 * s}" r="${72 * s}" fill="${COLORS.primary}" opacity="0.08"/>
  <circle cx="${width - 88 * s}" cy="${height - 60 * s}" r="${72 * s}" fill="${COLORS.primary}" opacity="0.06"/>
  ${titleElement}
  <text x="${textX}" y="${subtitleY}" fill="${COLORS.subtitle}" font-family="${FONT}" font-size="${subtitleSize}" font-weight="${SUBTITLE_WEIGHT}" text-anchor="middle">${escapeXml(subtitle)}</text>
  ${pill}`;

	return wrapSvgWithFonts(body, width, height, `role="img" aria-label="${escapeXml(title)}"`);
}

generateSocialCovers({
	outDir,
	width,
	height,
	buildSvg,
	platformLabel: 'Facebook'
});
