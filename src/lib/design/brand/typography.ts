/** Single source of truth for brand typography — feeds CSS generator, SMUI, social, email. */

export const BRAND_FONT_FAMILY = 'DM Sans';

export const BRAND_FONT_STACK = `'${BRAND_FONT_FAMILY}', system-ui, sans-serif`;

/** Email clients rarely load web fonts — explicit fallback stack. */
export const BRAND_FONT_STACK_EMAIL =
	"'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif";

export const brandFontSizes = {
	display: 'clamp(1.5rem, 4vw, 1.85rem)',
	body: '1rem',
	bodyMd: '0.9375rem',
	bodySm: '0.875rem',
	label: '0.75rem'
} as const;

export const brandFontWeights = {
	body: 400,
	medium: 500,
	semibold: 600,
	label: 600,
	display: 700
} as const;

export const brandLetterSpacing = {
	label: '0.04em',
	titleTight: '-0.02em'
} as const;

export const brandLineHeight = {
	body: '1.5'
} as const;

export const brandGoogleFonts = {
	family: 'DM+Sans',
	weights: [400, 500, 600, 700] as const,
	opsz: '9..40',
	display: 'swap' as const
} as const;

/** Google Fonts CSS2 URL — used in app.html via Vite transform and docs. */
export function buildGoogleFontsCssUrl(): string {
	const weightParams = brandGoogleFonts.weights.map((w) => `0,${brandGoogleFonts.opsz},${w}`).join(';');
	return `https://fonts.googleapis.com/css2?family=${brandGoogleFonts.family}:ital,opsz,wght@${weightParams}&display=${brandGoogleFonts.display}`;
}
