import {
	AI_UNIT_ECONOMICS,
	FREE_LIMITS,
	PRICE_HYPOTHESIS_SEK,
	NEARBY_RADIUS_M,
	PRO_LIMITS,
	type ProFeatureKey
} from '$lib/domain/plan';
import type { MarketingLocale } from '$lib/marketing/content';

export interface PricingTierRow {
	label: string;
	free: string;
	pro: string;
}

export interface PricingContent {
	title: string;
	lead: string;
	proLiveNote: string;
	meta: {
		title: string;
		description: string;
		ogTitle: string;
		ogDescription: string;
	};
	proCtaTitle: string;
	proCtaLead: string;
	proCtaUpgradeLabel: string;
	proCtaRegisterLabel: string;
	freeTitle: string;
	proTitle: string;
	proPriceLabel: string;
	priceHypothesisTitle: string;
	priceHypothesisBody: string;
	comparisonRows: PricingTierRow[];
	proBullets: string[];
	aiNoteTitle: string;
	aiNoteBody: string;
	stripeNoteTitle: string;
	stripeNoteBody: string;
	faqHref: string;
	faqLinkLabel: string;
	fullDocHint: string;
}

const proFeatureLabelsSv: Record<ProFeatureKey, string> = {
	unlimitedAi: 'Obegränsad AI-skannning (streckkod, foto)',
	unlimitedReceiptPdf: 'Obegränsad kvitto-PDF-tolkning',
	unlimitedSmartFill: 'Obegränsad smart inköpslista',
	insightsAndStats: 'AI-insikter och full statistik',
	moreHouseholdMembers: `Upp till ${PRO_LIMITS.maxHouseholdMembers} hushållsmedlemmar`,
	nearbyRadius: `Grannskafferiet: sök inom ${NEARBY_RADIUS_M.pro / 1000} km (gratis ${NEARBY_RADIUS_M.free} m)`
};

const sv: PricingContent = {
	title: 'Priser & planer',
	lead: 'Skaffu är gratis att komma igång. När du vill ha mer kraft kan du uppgradera till Pro — utan att tappa gratisplanen.',
	proLiveNote:
		'Pro är live. Uppgradera i appen när du är redo; gratisplanen finns kvar för dig som vill prova i lugn och ro.',
	meta: {
		title: 'Priser — Skaffu skafferi-app (Gratis & Pro)',
		description:
			'Generös gratisplan med lager och inköpslista. Pro från cirka 39 kr/mån med obegränsad AI, kvitto-PDF och fler i hushållet.',
		ogTitle: 'Skaffu — Gratis skafferi-app & Pro',
		ogDescription:
			'Jämför Free vs Pro: lager, AI-skannar och kvitto-PDF. Pro är tillgängligt — uppgradera i appen när du vill.'
	},
	proCtaTitle: 'Uppgradera till Pro',
	proCtaLead:
		'Logga in som ägare av hushållet och välj månads- eller årsplan under Inställningar → Plan. Avsluta eller byt plan när som helst.',
	proCtaUpgradeLabel: 'Logga in och uppgradera',
	proCtaRegisterLabel: 'Skapa konto gratis',
	freeTitle: 'Gratis',
	proTitle: 'Pro',
	proPriceLabel: `från ${PRICE_HYPOTHESIS_SEK.monthly} kr/mån eller ${PRICE_HYPOTHESIS_SEK.yearly} kr/år`,
	priceHypothesisTitle: 'Pro-pris',
	priceHypothesisBody: `${PRICE_HYPOTHESIS_SEK.monthly} kr/månad eller ${PRICE_HYPOTHESIS_SEK.yearly} kr/år — i linje med svenska konkurrenter (${PRICE_HYPOTHESIS_SEK.competitorMonthlyLow}–${PRICE_HYPOTHESIS_SEK.competitorMonthlyHigh} kr/mån).`,
	comparisonRows: [
		{
			label: 'Lagerrader',
			free: `Upp till ${FREE_LIMITS.maxInventoryItems}`,
			pro: 'Obegränsat'
		},
		{
			label: 'Hushållsmedlemmar',
			free: `${FREE_LIMITS.maxHouseholdMembers}`,
			pro: `Upp till ${PRO_LIMITS.maxHouseholdMembers}`
		},
		{
			label: 'AI-skannar / månad',
			free: `${FREE_LIMITS.aiScansPerMonth}`,
			pro: 'Obegränsat'
		},
		{
			label: 'Kvitto-PDF / månad',
			free: `${FREE_LIMITS.receiptPdfParsesPerMonth}`,
			pro: 'Obegränsat'
		},
		{
			label: 'Smart fill / vecka',
			free: `${FREE_LIMITS.smartFillPerWeek}`,
			pro: 'Obegränsat'
		},
		{
			label: 'Grannskafferiet-radie',
			free: `${NEARBY_RADIUS_M.free} m`,
			pro: `${NEARBY_RADIUS_M.pro / 1000} km`
		}
	],
	proBullets: Object.values(proFeatureLabelsSv),
	aiNoteTitle: 'Varför gränser?',
	aiNoteBody: `AI-funktioner kostar per anrop (modell ${AI_UNIT_ECONOMICS.model}). En typisk kvitto-PDF kostar ungefär ${AI_UNIT_ECONOMICS.receiptParseSekLow}–${AI_UNIT_ECONOMICS.receiptParseSekHigh} kr i API-avgift — därför begränsar vi AI i gratisplanen och finansierar obegränsat via Pro.`,
	stripeNoteTitle: 'Betalning & villkor',
	stripeNoteBody:
		'Betalning sker via Stripe. Som hushållsägare kan du hantera prenumeration, byta mellan månad och år eller avsluta under Inställningar → Plan. Konsumentvillkor från Stripe gäller vid köp.',
	faqHref: '/faq',
	faqLinkLabel: 'Vanliga frågor',
	fullDocHint: 'Intern produktdokumentation: docs/PRICING.md'
};

const en: PricingContent = {
	...sv,
	title: 'Pricing & plans',
	lead: 'Skaffu is free to get started. Upgrade to Pro when you want more power — without losing the free tier.',
	proLiveNote:
		'Pro is live. Upgrade in the app when you are ready; the free plan stays available if you want to take it slow.',
	meta: {
		title: 'Pricing — Skaffu (Free & Pro)',
		description:
			'Generous free tier with pantry and shopping list. Pro from about 39 SEK/month with unlimited AI, receipt PDF and more household members.',
		ogTitle: 'Skaffu — Free pantry & Pro',
		ogDescription:
			'Compare Free vs Pro: inventory, AI scans and receipt PDF. Pro is available — upgrade in the app when you want.'
	},
	proCtaTitle: 'Upgrade to Pro',
	proCtaLead:
		'Sign in as the household owner and pick monthly or yearly under Settings → Plan. Cancel or switch plans anytime.',
	proCtaUpgradeLabel: 'Sign in and upgrade',
	proCtaRegisterLabel: 'Create a free account',
	freeTitle: 'Free',
	proTitle: 'Pro',
	proPriceLabel: `from ${PRICE_HYPOTHESIS_SEK.monthly} SEK/month or ${PRICE_HYPOTHESIS_SEK.yearly} SEK/year`,
	priceHypothesisTitle: 'Pro pricing',
	priceHypothesisBody: `${PRICE_HYPOTHESIS_SEK.monthly} SEK/month or ${PRICE_HYPOTHESIS_SEK.yearly} SEK/year — in line with Swedish competitors.`,
	comparisonRows: sv.comparisonRows.map((row) => ({
		...row,
		label:
			row.label === 'Lagerrader'
				? 'Pantry items'
				: row.label === 'Hushållsmedlemmar'
					? 'Household members'
					: row.label === 'AI-skannar / månad'
						? 'AI scans / month'
						: row.label === 'Kvitto-PDF / månad'
							? 'Receipt PDF / month'
							: row.label === 'Grannskafferiet-radie'
							? 'Neighbour pantry radius'
							: 'Smart fill / week'
	})),
	proBullets: [
		'Unlimited AI scanning (barcode, photo)',
		'Unlimited receipt PDF parsing',
		'Unlimited smart shopping list fill',
		'AI insights and full statistics',
		`Up to ${PRO_LIMITS.maxHouseholdMembers} household members`,
		`Neighbour pantry: search within ${NEARBY_RADIUS_M.pro / 1000} km (free ${NEARBY_RADIUS_M.free} m)`
	],
	aiNoteTitle: 'Why limits?',
	aiNoteBody: `AI features cost per API call (${AI_UNIT_ECONOMICS.model}). A typical receipt PDF costs about ${AI_UNIT_ECONOMICS.receiptParseSekLow}–${AI_UNIT_ECONOMICS.receiptParseSekHigh} SEK — so Free tier caps AI usage and Pro funds unlimited use.`,
	stripeNoteTitle: 'Billing & terms',
	stripeNoteBody:
		'Payments go through Stripe. As household owner you can manage your subscription, switch monthly/yearly or cancel under Settings → Plan. Stripe consumer terms apply at checkout.',
	faqLinkLabel: 'FAQ',
	fullDocHint: 'Internal product doc: docs/PRICING.md'
};

const byLocale: Record<MarketingLocale, PricingContent> = { sv, en };

export function getPricingContent(locale: MarketingLocale): PricingContent {
	return byLocale[locale] ?? sv;
}
