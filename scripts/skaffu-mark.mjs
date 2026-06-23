/**
 * Shared Skaffu icon mark for social SVG generators — geometry from static/favicon.svg.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const faviconPath = join(root, 'static/favicon.svg');

/** @type {{ primary: string; house: string; shelf: string; accent: string }} */
export const BRAND_MARK_COLORS = {
	primary: '#2c4a3e',
	house: '#ffffff',
	shelf: '#e8f0ea',
	accent: '#d4a853'
};

/** @returns {string} Inner SVG elements from favicon (32×32 viewBox). */
export function getMarkInnerSvg() {
	const svg = readFileSync(faviconPath, 'utf8');
	return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
}

const MARK_INNER = getMarkInnerSvg();

/**
 * Scale favicon mark to `size` px and place top-left at (x, y).
 * @param {{ x: number; y: number; size: number }} opts
 */
export function buildMarkGroup({ x, y, size }) {
	const scale = size / 32;
	return `<g transform="translate(${x}, ${y}) scale(${scale})">${MARK_INNER}</g>`;
}
