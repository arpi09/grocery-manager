/**
 * Shared social cover slide generator (LinkedIn, Facebook).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { COVER_SLIDES } from './social-brand.mjs';
import { writeSvgAsPng } from './social-render.mjs';

/**
 * @param {{
 *   outDir: string;
 *   width: number;
 *   height: number;
 *   buildSvg: (title: string, subtitle: string, showPill: boolean) => string;
 *   platformLabel: string;
 * }} options
 */
export function generateSocialCovers({ outDir, width, height, buildSvg, platformLabel }) {
	mkdirSync(outDir, { recursive: true });

	const generated = [];

	for (const slide of COVER_SLIDES) {
		const svg = buildSvg(slide.title, slide.subtitle, slide.showPill ?? false);
		const outPath = join(outDir, `cover-${slide.fileSuffix}.png`);

		writeSvgAsPng(svg, width, height, outPath);

		generated.push(outPath);
		console.log(`Wrote ${outPath} (${width}x${height})`);
	}

	console.log(`\nGenerated ${generated.length} covers in ${outDir}/ (${platformLabel})`);
}
