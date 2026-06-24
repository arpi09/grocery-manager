import { LOCKED_LOGO_CORE } from '../brand-colors';
import { rgbaFromHex } from './color-utils';

export const brandRadius = { sm: '8px', md: '12px', lg: '16px' } as const;

export const brandSpace = {
	xs: '0.25rem',
	sm: '0.5rem',
	md: '1rem',
	lg: '1.5rem',
	xl: '2rem'
} as const;

export const brandTouchTargetMin = '2.75rem';

/** Shadow alpha on locked light text rgb (see brand-tokens.generated.css). */
export const brandShadowAlpha = { sm: 0.08, md: 0.1, nav: 0.06 } as const;

export const brandShadowDark = {
	sm: '0 1px 3px rgba(0, 0, 0, 0.35)',
	md: '0 4px 16px rgba(0, 0, 0, 0.4)',
	nav: '0 -4px 24px rgba(0, 0, 0, 0.28)'
} as const;

/** Social OG/LinkedIn gradient end — warm green tint from brand bg family. */
export const BRAND_SOCIAL_BG_END = '#e8f0ea';

export function rgbaFromBrandText(alpha: number, mode: 'light' | 'dark' = 'light'): string {
	return rgbaFromHex(LOCKED_LOGO_CORE[mode].text, alpha);
}

export function buildLightShadows(): Record<string, string> {
	const text = LOCKED_LOGO_CORE.light.text;
	return {
		'--shadow-sm': `0 1px 3px ${rgbaFromHex(text, brandShadowAlpha.sm)}`,
		'--shadow-md': `0 4px 16px ${rgbaFromHex(text, brandShadowAlpha.md)}`,
		'--nav-bottom-shadow': `0 -4px 24px ${rgbaFromHex(text, brandShadowAlpha.nav)}`
	};
}
