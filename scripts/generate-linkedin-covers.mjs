/**

 * Generate LinkedIn company page cover PNGs at 2× (2256×382).

 * LinkedIn minimum is 1128×191; 2× keeps text sharp after platform downscale/crop.

 * Run: npm run generate:linkedin-covers

 */

import { mkdirSync } from 'node:fs';

import { dirname, join } from 'node:path';

import { fileURLToPath } from 'node:url';



const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const outDir = join(root, 'static/linkedin');



/** LinkedIn display minimum; export at 2× for sharper rendering. */

const SCALE = 2;

const width = 1128 * SCALE;

const height = 191 * SCALE;

/** Profile logo overlaps ~220px on the left at 1× display — keep text out of this band. */

const SAFE_LEFT = 220 * SCALE;

const textX = Math.round((SAFE_LEFT + width) / 2);



const COLORS = {

	bgStart: '#f7f5f0',

	bgEnd: '#e8f0ea',

	primary: '#3d6b4f',

	title: '#1a2e22',

	subtitle: '#4a5c52',

	white: '#ffffff'

};



const FONT = 'DM Sans, system-ui, -apple-system, sans-serif';



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



/** @param {string} text */

function escapeXml(text) {

	return text

		.replace(/&/g, '&amp;')

		.replace(/</g, '&lt;')

		.replace(/>/g, '&gt;')

		.replace(/"/g, '&quot;');

}



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

  <circle cx="${980 * s}" cy="${28 * s}" r="${72 * s}" fill="${COLORS.primary}" opacity="0.08"/>

  <circle cx="${width - 88 * s}" cy="${height - 40 * s}" r="${72 * s}" fill="${COLORS.primary}" opacity="0.06"/>

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



	await sharp(Buffer.from(svg))

		.png({ compressionLevel: 9 })

		.toFile(outPath);



	generated.push(outPath);

	console.log(`Wrote ${outPath} (${width}x${height})`);

}



console.log(`\nGenerated ${generated.length} covers in static/linkedin/`);


