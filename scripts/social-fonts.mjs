/**
 * DM Sans for social SVG assets.
 * Base64 @font-face in SVG — rendered by resvg (see social-render.mjs).
 * Sharp/librsvg ignores embedded @font-face src; do not use Sharp for text SVGs.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fontsDir = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'node_modules',
	'@fontsource',
	'dm-sans',
	'files'
);

const UNICODE_LATIN =
	'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const UNICODE_LATIN_EXT =
	'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

/** @param {400 | 600 | 700} weight @param {'latin' | 'latin-ext'} subset */
export function readDmSansWoff2(weight, subset = 'latin') {
	const file = join(fontsDir, `dm-sans-${subset}-${weight}-normal.woff2`);
	return readFileSync(file);
}

/** @param {400 | 600 | 700} weight @param {'latin' | 'latin-ext'} subset */
function fontFaceRule(weight, subset) {
	const data = readDmSansWoff2(weight, subset).toString('base64');
	const range = subset === 'latin' ? UNICODE_LATIN : UNICODE_LATIN_EXT;
	return `@font-face{font-family:'DM Sans';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${range};}`;
}

let cachedStyleBlock;

/** @returns {string} `<style>` block with embedded @font-face rules */
export function dmSansFontFaceStyleBlock() {
	if (cachedStyleBlock) return cachedStyleBlock;

	const weights = /** @type {const} */ ([400, 600, 700]);
	const rules = weights.flatMap((w) => [fontFaceRule(w, 'latin-ext'), fontFaceRule(w, 'latin')]);
	cachedStyleBlock = `<style>${rules.join('')}</style>`;
	return cachedStyleBlock;
}

/**
 * @param {string} body Inner SVG markup (no outer `<svg>`)
 * @param {number} width
 * @param {number} height
 * @param {string} [extraAttrs] e.g. `role="img" aria-label="Skaffu"`
 */
export function wrapSvgWithFonts(body, width, height, extraAttrs = '') {
	const attrs = extraAttrs ? ` ${extraAttrs}` : '';
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"${attrs}>
${dmSansFontFaceStyleBlock()}
${body}
</svg>`;
}
