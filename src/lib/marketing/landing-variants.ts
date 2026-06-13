import type { MarketingLocale } from '$lib/marketing/content';

export type LandingHeroVariant = 'a' | 'b';

export type ReceiptHeroVariant = 'a' | 'b' | 'c';

export const LANDING_VARIANT_COOKIE = 'landing_variant';

export const RECEIPT_HERO_VARIANT_COOKIE = 'receipt_hero_variant';

export interface LandingHeroCopy {
	heroTitle: string;
	heroLead: string;
	heroSecondary: string;
}

const heroByVariant: Record<MarketingLocale, Record<LandingHeroVariant, LandingHeroCopy>> = {
	sv: {
		a: {
			heroTitle: 'Er gemensamma veckolista — handla ihop.',
			heroLead:
				'Bygg veckans inköpslista tillsammans. Bjud in partner eller familj — samma lista, uppdateras när ni handlar.',
			heroSecondary:
				'Skafferi, utgångsdatum och smart påfyllning när ni vill — streckkod, kvitto eller foto som snabbstart.'
		},
		b: {
			heroTitle: 'Butiksneutralt skafferi för hela hushållet.',
			heroLead:
				'Oavsett ICA, Willys, Coop eller Lidl — ett gemensamt lager, utgångsdatum och inköpslista som speglar vad som faktiskt finns hemma.',
			heroSecondary:
				'Kvitto-autopilot från digitala PDF:er, Ät det först och webb först — utan stammiskonto eller matkedja som låser in dig.'
		}
	},
	en: {
		a: {
			heroTitle: 'Your shared weekly list — shop together.',
			heroLead:
				'Build this week\'s shopping list together. Invite your partner or family — same list, updates as you shop.',
			heroSecondary:
				'Pantry, expiry dates and smart replenishment when you want — barcode, receipt or photo for a quick start.'
		},
		b: {
			heroTitle: 'Store-neutral pantry for the whole household.',
			heroLead:
				'Whether ICA, Willys, Coop or Lidl — one shared inventory, expiry dates and shopping list based on what is actually at home.',
			heroSecondary:
				'Receipt autopilot from digital PDFs, Eat First and web-first — no loyalty account or retailer lock-in.'
		}
	}
};

const receiptHeroByVariant: Record<MarketingLocale, Record<ReceiptHeroVariant, LandingHeroCopy>> = {
	sv: {
		a: {
			heroTitle: 'Ladda upp ett digitalt kvitto — Skaffu fyller skafferiet',
			heroLead:
				'Spara PDF från Kivra, ICA eller e-post och ladda upp i Skaffu. AI läser raderna — du granskar innan de hamnar i lagret.',
			heroSecondary:
				'Receipt autopilot utan manuell inmatning. Butiksneutralt skafferi för hela hushållet.'
		},
		b: {
			heroTitle: 'Gör kvitton till skafferi automatiskt',
			heroLead:
				'Digitalt kvitto → granskning → kyl, frys och skafferi uppdateras. Ingen officiell butiksintegration — bara din PDF.',
			heroSecondary:
				'Prova gratis med ett kvitto eller några streckkoder. Webb först på skaffu.com.'
		},
		c: {
			heroTitle: 'Bygg skafferiet från kvitton istället för att skriva in allt',
			heroLead:
				'Ladda upp digitalt kvitto (PDF), granska raderna och spara valda varor — snabbare än att mata in varje produkt.',
			heroSecondary:
				'Fungerar med text-PDF från Kivra, ICA, Willys och fler. Du behåller kontrollen med review-steg.'
		}
	},
	en: {
		a: {
			heroTitle: 'Upload a digital receipt — Skaffu fills the pantry',
			heroLead:
				'Save a PDF from Kivra, ICA or email and upload in Skaffu. AI reads the lines — you review before they enter inventory.',
			heroSecondary:
				'Receipt autopilot without manual entry. Store-neutral pantry for the whole household.'
		},
		b: {
			heroTitle: 'Turn receipts into pantry automatically',
			heroLead:
				'Digital receipt → review → fridge, freezer and cupboard updated. No official store integration — just your PDF.',
			heroSecondary:
				'Try free with one receipt or a few barcodes. Web-first at skaffu.com.'
		},
		c: {
			heroTitle: 'Build the pantry from receipts instead of typing everything',
			heroLead:
				'Upload a digital receipt (PDF), review lines and save selected items — faster than entering each product.',
			heroSecondary:
				'Works with text PDFs from Kivra, ICA, Willys and more. You stay in control with a review step.'
		}
	}
};

export function isLandingHeroVariant(value: string | null | undefined): value is LandingHeroVariant {
	return value === 'a' || value === 'b';
}

export function isReceiptHeroVariant(value: string | null | undefined): value is ReceiptHeroVariant {
	return value === 'a' || value === 'b' || value === 'c';
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

/** Query `?receipt_hero=` wins, then cookie (if allowed), default `a`. */
export function resolveReceiptHeroVariant(input: {
	queryReceiptHero?: string | null;
	cookieVariant?: string | null;
	allowVariantCookie?: boolean;
}): ReceiptHeroVariant {
	const fromQuery = input.queryReceiptHero?.trim().toLowerCase();
	if (isReceiptHeroVariant(fromQuery)) {
		return fromQuery;
	}
	if (input.allowVariantCookie !== false && isReceiptHeroVariant(input.cookieVariant)) {
		return input.cookieVariant;
	}
	return 'a';
}

export function getLandingHeroCopy(
	variant: LandingHeroVariant,
	locale: MarketingLocale = 'sv'
): LandingHeroCopy {
	return heroByVariant[locale][variant];
}

export function getReceiptHeroCopy(
	variant: ReceiptHeroVariant,
	locale: MarketingLocale = 'sv'
): LandingHeroCopy {
	return receiptHeroByVariant[locale][variant];
}

/** Apply receipt hero experiment copy when `?receipt_hero=` is active. */
export function mergeReceiptHeroExperiment(
	baseHero: LandingHeroCopy,
	receiptVariant: ReceiptHeroVariant | null,
	locale: MarketingLocale = 'sv'
): LandingHeroCopy {
	if (!receiptVariant) {
		return baseHero;
	}
	return getReceiptHeroCopy(receiptVariant, locale);
}
