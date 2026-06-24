/** Shared brand tokens for social asset generators (LinkedIn, Facebook, OG). */

import {
	COLORS,
	FONT,
	TITLE_LETTER_SPACING,
	TITLE_WEIGHT,
	SUBTITLE_WEIGHT,
	BODY_WEIGHT,
	PRIMARY
} from './brand-tokens.generated.mjs';
import { buildMarkGroup } from './skaffu-mark.mjs';
import { wrapSvgWithFonts } from './social-fonts.mjs';

export { wrapSvgWithFonts, FONT, TITLE_WEIGHT, SUBTITLE_WEIGHT, BODY_WEIGHT, TITLE_LETTER_SPACING, PRIMARY, COLORS };

/** Cover/share slide copy — synced with src/lib/marketing/content.ts landing */
export const COVER_SLIDES = [
	{
		fileSuffix: 'hero',
		title: 'Skaffu',
		subtitle: 'Handla ihop med koll på skafferiet',
		showPill: true
	},
	{
		fileSuffix: '02-scan',
		title: 'Delad lista i realtid',
		subtitle: 'Bjud in partner, checka av i butiken'
	},
	{
		fileSuffix: '03-meal',
		title: 'Koll på skafferiet',
		subtitle: 'Se vad som finns hemma innan ni handlar'
	},
	{
		fileSuffix: '04-waste',
		title: 'Se vad som går ut snart',
		subtitle: 'Mindre matsvinn hemma'
	},
	{
		fileSuffix: '05-cta',
		title: 'Kom igång gratis',
		subtitle: 'skaffu.com',
		showPill: true
	}
];

/** @param {string} text */
export function escapeXml(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** @param {string} title */
export function titleLetterSpacingAttr(title) {
	return title === 'Skaffu' ? ` letter-spacing="${TITLE_LETTER_SPACING}"` : '';
}

/** OG / share hero mark size (1200×630). */
export const OG_MARK_SIZE = 108;

/**
 * Title as icon mark when title is "Skaffu", otherwise DM Sans text.
 * @param {string} title
 * @param {{
 *   x: number;
 *   y: number;
 *   fontSize: number;
 *   fill?: string;
 *   textAnchor?: 'start' | 'middle' | 'end';
 *   markSize?: number;
 * }} opts — y is text baseline for text, or mark top-left when title is Skaffu
 */
export function renderTitleElement(title, opts) {
	const { x, y, fontSize, fill = COLORS.title, textAnchor = 'start', markSize = OG_MARK_SIZE } = opts;

	if (title === 'Skaffu') {
		const markX =
			textAnchor === 'middle' ? x - markSize / 2
			: textAnchor === 'end' ? x - markSize
			: x;
		return buildMarkGroup({ x: markX, y, size: markSize });
	}

	const anchorAttr = textAnchor !== 'start' ? ` text-anchor="${textAnchor}"` : '';

	return `<text x="${x}" y="${y}" fill="${fill}" font-family="${FONT}" font-size="${fontSize}" font-weight="${TITLE_WEIGHT}"${titleLetterSpacingAttr(title)}${anchorAttr}>${escapeXml(title)}</text>`;
}

/**
 * OG / share-hero layout body (1200×630).
 * @param {{ title?: string; subtitle?: string; tagline?: string; showPill?: boolean }} [opts]
 */
export function buildOgSvgBody(opts = {}) {
	const title = opts.title ?? 'Skaffu';
	const subtitle = opts.subtitle ?? 'Handla ihop med koll på skafferiet';
	const tagline = opts.tagline ?? 'Delad lista · utgångsdatum · mindre matsvinn';
	const showPill = opts.showPill ?? true;

	const titleSize = 88;
	const titleY = 280;
	const markY = titleY - OG_MARK_SIZE;
	const subtitleY = title === 'Skaffu' ? 380 : 360;
	const subtitleSize = 42;
	const taglineY = 430;
	const taglineSize = 32;
	const pillY = 480;

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

	return `<defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.bgStart}"/>
      <stop offset="100%" stop-color="${COLORS.bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="180" fill="${COLORS.primary}" opacity="0.08"/>
  <circle cx="180" cy="520" r="220" fill="${COLORS.primary}" opacity="0.06"/>
  ${titleElement}
  <text x="96" y="${subtitleY}" fill="${COLORS.primary}" font-family="${FONT}" font-size="${subtitleSize}" font-weight="${SUBTITLE_WEIGHT}">${escapeXml(subtitle)}</text>
  <text x="96" y="${taglineY}" fill="${COLORS.subtitle}" font-family="${FONT}" font-size="${taglineSize}" font-weight="${BODY_WEIGHT}">${escapeXml(tagline)}</text>
  ${pill}`;
}

/** @param {{ title?: string; subtitle?: string; tagline?: string; showPill?: boolean }} [opts] */
export function buildOgSvg(opts = {}) {
	return wrapSvgWithFonts(
		buildOgSvgBody(opts),
		1200,
		630,
		'role="img" aria-label="Skaffu — handla ihop med koll på skafferiet"'
	);
}
