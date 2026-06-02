import type { MarketingLocale } from '$lib/marketing/content';

export type LandingHeroVariant = 'a' | 'b';

export const LANDING_VARIANT_COOKIE = 'landing_variant';

export interface LandingHeroCopy {
	heroTitle: string;
	heroLead: string;
	heroSecondary: string;
}

const heroByVariant: Record<MarketingLocale, Record<LandingHeroVariant, LandingHeroCopy>> = {
	sv: {
		a: {
			heroTitle: 'Skafferiet du faktiskt har koll på.',
			heroLead:
				'Skanna in det du har hemma på sekunder — streckkod, kvitto eller foto — och se kyl, frys och skafferi på ett ställe.',
			heroSecondary:
				'Ät det som går ut först, planera måltider och låt inköpslistan fylla på sig från lager som sanningskälla.'
		},
		b: {
			heroTitle: 'Butiksneutralt skafferi för hela hushållet.',
			heroLead:
				'Oavsett ICA, Willys, Coop eller Lidl — ett gemensamt lager, utgångsdatum och inköpslista som speglar vad som faktiskt finns hemma.',
			heroSecondary:
				'Kvitto-autopilot från Kivra, Ät det först och webb först — utan stammiskonto eller matkedja som låser in dig.'
		}
	},
	en: {
		a: {
			heroTitle: 'The pantry you actually keep track of.',
			heroLead:
				'Scan what you have at home in seconds — barcode, receipt or photo — and see fridge, freezer and cupboard in one place.',
			heroSecondary:
				'Eat what expires first, plan meals and let the shopping list fill from inventory as source of truth.'
		},
		b: {
			heroTitle: 'Store-neutral pantry for the whole household.',
			heroLead:
				'Whether ICA, Willys, Coop or Lidl — one shared inventory, expiry dates and shopping list based on what is actually at home.',
			heroSecondary:
				'Receipt autopilot from Kivra, Eat First and web-first — no loyalty account or retailer lock-in.'
		}
	}
};

export function isLandingHeroVariant(value: string | null | undefined): value is LandingHeroVariant {
	return value === 'a' || value === 'b';
}

/** Query `?hero=` wins, then cookie (if allowed), then `PUBLIC_LANDING_VARIANT`, default `a`. */
export function resolveLandingVariant(input: {
	queryHero?: string | null;
	cookieVariant?: string | null;
	envVariant?: string | null;
	/** When false, `landing_variant` cookie is ignored (essential-only / no consent yet). */
	allowVariantCookie?: boolean;
}): LandingHeroVariant {
	const fromQuery = input.queryHero?.trim().toLowerCase();
	if (isLandingHeroVariant(fromQuery)) {
		return fromQuery;
	}
	if (input.allowVariantCookie !== false && isLandingHeroVariant(input.cookieVariant)) {
		return input.cookieVariant;
	}
	const fromEnv = input.envVariant?.trim().toLowerCase();
	if (isLandingHeroVariant(fromEnv)) {
		return fromEnv;
	}
	return 'a';
}

export function getLandingHeroCopy(
	variant: LandingHeroVariant,
	locale: MarketingLocale = 'sv'
): LandingHeroCopy {
	return heroByVariant[locale][variant];
}
