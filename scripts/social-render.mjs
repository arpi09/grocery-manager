/**
 * Rasterize social SVG to PNG via resvg (embedded @font-face works; Sharp/librsvg ignores src).
 */
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

/**
 * @param {string | Buffer} svg
 * @param {number} width
 * @param {number} height
 */
export function renderSvgToPng(svg, width, height) {
	const input = typeof svg === 'string' ? Buffer.from(svg) : svg;
	const resvg = new Resvg(input, {
		fitTo: { mode: 'width', value: width }
	});
	const rendered = resvg.render();
	if (rendered.height !== height) {
		throw new Error(
			`SVG raster height mismatch: expected ${height}, got ${rendered.height} (width ${width})`
		);
	}
	return rendered.asPng();
}

/**
 * @param {string | Buffer} svg
 * @param {number} width
 * @param {number} height
 * @param {string} outPath
 */
export function writeSvgAsPng(svg, width, height, outPath) {
	writeFileSync(outPath, renderSvgToPng(svg, width, height));
}
