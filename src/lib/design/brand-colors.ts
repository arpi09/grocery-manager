/**

 * Single source of truth for brand hex values.

 * UI should use CSS custom properties; this module feeds generators, manifest, and email.

 */



export type BrandColorMode = 'light' | 'dark';

export type PaletteTrack = 'heritage' | 'fresh' | 'warm' | 'crisp';



export interface BrandCoreTokens {

	primary: string;

	primaryHover: string;

	onPrimary: string;

	accent: string;

	bg: string;

	surface: string;

	surfaceMuted: string;

	border: string;

	text: string;

	textMuted: string;

}



export interface BrandSemanticTokens {

	secondary: string;

	taupe: string;

	success: string;

	warning: string;

	danger: string;

	info: string;

	fridge: string;

	freezer: string;

	cupboard: string;

	learningAi: string;

	/** Per-track AI shimmer gradient (preview + future UI). Hex only. */

	learningAiGradientStops?: readonly string[];

}



export type BrandPalette = BrandCoreTokens & BrandSemanticTokens;



export type BrandPaletteByMode = Record<BrandColorMode, BrandPalette>;



/** Logo / brand core — immutable across palette tracks. */

export const LOCKED_LOGO_CORE: Record<BrandColorMode, BrandCoreTokens> = {

	light: {

		primary: '#2c4a3e',

		primaryHover: '#243d32',

		onPrimary: '#ffffff',

		accent: '#d4a853',

		bg: '#f7f5f0',

		surface: '#ffffff',

		surfaceMuted: '#eef2eb',

		border: '#dde5d8',

		text: '#1f2a24',

		textMuted: '#4a5850'

	},

	dark: {

		primary: '#4d8f68',

		primaryHover: '#5aa076',

		onPrimary: '#ffffff',

		accent: '#d4a853',

		bg: '#141a17',

		surface: '#1e2820',

		surfaceMuted: '#243028',

		border: '#2a3d30',

		text: '#a0b0a8',

		textMuted: '#8fa399'

	}

};



type SemanticByMode = Record<BrandColorMode, BrandSemanticTokens>;



/** Per-track semantic overrides (merged with LOCKED_LOGO_CORE). Location + learning default to heritage when omitted. */

const HERITAGE_SEMANTIC: SemanticByMode = {

	light: {

		secondary: '#5a6f62',

		taupe: '#c4b8a8',

		success: '#2d6a4f',

		warning: '#9a6700',

		danger: '#b54a4a',

		info: '#3d6b8c',

		fridge: '#064E3B',

		freezer: '#475569',

		cupboard: '#9E5528',

		learningAi: '#5B3D8F',

		learningAiGradientStops: ['#4A3278', '#5B3D8F', '#6B4E9E', '#5B3D8F']

	},

	dark: {

		secondary: '#7a9488',

		taupe: '#a89888',

		success: '#5cb88a',

		warning: '#e8a317',

		danger: '#e07a7a',

		info: '#6eb0d4',

		fridge: '#6EE7B7',

		freezer: '#CBD5E1',

		cupboard: '#E09858',

		learningAi: '#B0A8F0',

		learningAiGradientStops: ['#9080D8', '#B0A8F0', '#C0B8F8', '#B0A8F0']

	}

};



const FRESH_SEMANTIC: SemanticByMode = {

	light: {

		secondary: '#8a9a7b',

		taupe: HERITAGE_SEMANTIC.light.taupe,

		success: '#3d8f5c',

		warning: '#c9870a',

		danger: '#c44d4d',

		info: '#4a8fb8',

		fridge: '#056B52',

		freezer: '#3F4F63',

		cupboard: '#A05228',

		learningAi: '#4A62A8',

		learningAiGradientStops: ['#3E5288', '#4A62A8', '#5A72B8', '#4A62A8']

	},

	dark: {

		secondary: '#9aad92',

		taupe: HERITAGE_SEMANTIC.dark.taupe,

		success: '#6ecf96',

		warning: '#f0b429',

		danger: '#f09090',

		info: '#7ec4e8',

		fridge: '#34D399',

		freezer: '#D1D5DB',

		cupboard: '#E8A060',

		learningAi: '#8A9EE8',

		learningAiGradientStops: ['#7088D0', '#8A9EE8', '#9AB0F0', '#8A9EE8']

	}

};



const WARM_SEMANTIC: SemanticByMode = {

	light: {

		secondary: '#c4b8a8',

		taupe: '#c4b8a8',

		success: '#4d8f68',

		warning: '#b45309',

		danger: HERITAGE_SEMANTIC.light.danger,

		info: '#5a7f96',

		fridge: '#065F46',

		freezer: '#57534E',

		cupboard: '#A05228',

		learningAi: '#8B4D72',

		learningAiGradientStops: ['#7A4265', '#8B4D72', '#9A5A82', '#8B4D72']

	},

	dark: {

		secondary: '#a89888',

		taupe: '#a89888',

		success: '#6aaf82',

		warning: '#e8a317',

		danger: HERITAGE_SEMANTIC.dark.danger,

		info: '#8ab4c8',

		fridge: '#4ADE80',

		freezer: '#E7E5E4',

		cupboard: '#E0A068',

		learningAi: '#C890B8',

		learningAiGradientStops: ['#A878A0', '#C890B8', '#D8A0C8', '#C890B8']

	}

};



const CRISP_SEMANTIC: SemanticByMode = {

	light: {

		secondary: '#4a5850',

		taupe: HERITAGE_SEMANTIC.light.taupe,

		success: '#2c6e49',

		warning: '#b45309',

		danger: '#b42318',

		info: '#0f766e',

		fridge: '#065F46',

		freezer: '#334155',

		cupboard: '#9E5528',

		learningAi: '#5A48C8',

		learningAiGradientStops: ['#4A38A8', '#5A48C8', '#6A58D8', '#5A48C8']

	},

	dark: {

		secondary: '#8fa399',

		taupe: HERITAGE_SEMANTIC.dark.taupe,

		success: '#58b87a',

		warning: '#f5b82e',

		danger: '#f08080',

		info: '#4ec9b8',

		fridge: '#4ADE80',

		freezer: '#B0BEC9',

		cupboard: '#D89050',

		learningAi: '#A898F0',

		learningAiGradientStops: ['#8878D8', '#A898F0', '#B8A8F8', '#A898F0']

	}

};



export const PALETTE_TRACKS: Record<PaletteTrack, SemanticByMode> = {

	heritage: HERITAGE_SEMANTIC,

	fresh: FRESH_SEMANTIC,

	warm: WARM_SEMANTIC,

	crisp: CRISP_SEMANTIC

};



export const PALETTE_TRACK_LIST: PaletteTrack[] = ['heritage', 'fresh', 'warm', 'crisp'];



/** Per-track AI gradient stops (light mode canonical). Falls back to solid learningAi. */

export function getLearningAiGradientStops(track: PaletteTrack): readonly string[] {

	const stops = PALETTE_TRACKS[track].light.learningAiGradientStops;

	if (stops?.length) return stops;

	return [PALETTE_TRACKS[track].light.learningAi];

}



/** Merge locked logo core with a track's semantic palette. */

export function mergePalette(track: PaletteTrack): BrandPaletteByMode {

	const semantic = PALETTE_TRACKS[track];

	return {

		light: { ...LOCKED_LOGO_CORE.light, ...semantic.light },

		dark: { ...LOCKED_LOGO_CORE.dark, ...semantic.dark }

	};

}



const PALETTE_TO_CSS: Record<Exclude<keyof BrandPalette, 'learningAiGradientStops'>, string> = {

	primary: '--color-primary',

	primaryHover: '--color-primary-hover',

	onPrimary: '--color-on-primary',

	accent: '--color-accent',

	bg: '--color-bg',

	surface: '--color-surface',

	surfaceMuted: '--color-surface-muted',

	border: '--color-border',

	text: '--color-text',

	textMuted: '--color-text-muted',

	secondary: '--color-secondary',

	taupe: '--color-taupe',

	success: '--color-success',

	warning: '--color-warning',

	danger: '--color-danger',

	info: '--color-info',

	fridge: '--color-fridge',

	freezer: '--color-freezer',

	cupboard: '--color-cupboard',

	learningAi: '--color-learning-ai'

};



/** Map a merged palette to CSS custom property names and hex values. */

export function toCssCustomProperties(

	palette: BrandPalette,

	_mode: BrandColorMode

): Record<string, string> {
	void _mode;

	const out: Record<string, string> = {};

	for (const [key, cssVar] of Object.entries(PALETTE_TO_CSS) as Array<

		[keyof BrandPalette, string]

	>) {

		if (key === 'learningAiGradientStops') continue;

		out[cssVar] = palette[key] as string;

	}

	return out;

}



export const brandColors = {

	locked: LOCKED_LOGO_CORE,

	tracks: Object.fromEntries(PALETTE_TRACK_LIST.map((track) => [track, mergePalette(track)])) as Record<

		PaletteTrack,

		BrandPaletteByMode

	>

};



/** Backward-compatible aliases from locked light/dark core. */

export const BRAND_PRIMARY = LOCKED_LOGO_CORE.light.primary;

export const BRAND_BG = LOCKED_LOGO_CORE.light.bg;

export const BRAND_PRIMARY_DARK = LOCKED_LOGO_CORE.dark.primary;



/** Bump when regenerating static/pwa/*.png — busts iOS home-screen icon cache (also set in src/app.html). */

export const PWA_ICON_VERSION = '5';


