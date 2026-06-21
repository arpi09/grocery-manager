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
	proStatusNote: string;
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
	checkoutEnabled: boolean;
}

const proFeatureLabelsSv: Record<ProFeatureKey, string> = {
	unlimitedAi: 'Obegränsad AI-skannning (streckkod, foto)',
	unlimitedReceiptPdf: 'Obegränsad kvitto-PDF-tolkning',
	unlimitedSmartFill: 'Obegränsad smart inköpslista',
	insightsAndStats: 'AI-insikter och full statistik',
	moreHouseholdMembers: `Upp till ${PRO_LIMITS.maxHouseholdMembers} hushållsmedlemmar`,
	nearbyRadius: `Grannskafferiet: sök inom ${NEARBY_RADIUS_M.pro / 1000} km (gratis ${NEARBY_RADIUS_M.free} m)`
};

const pricingLiveSv: Omit<PricingContent, 'checkoutEnabled'> = {
	title: 'Priser & planer',
	lead: 'Börja gratis med delad lista och skafferi. När hela hushållet är med och ni vill ha statistik och obegränsad kvitto-PDF kan ni uppgradera till Pro — utan att tappa gratisplanen.',
	proStatusNote:
		'Pro är live. Uppgradera i appen när ni är redo; gratisplanen finns kvar för er som vill prova i lugn och ro.',
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
	aiNoteTitle: 'Varför gränser på AI?',
	aiNoteBody: `Kvitto-PDF tolkas automatiskt — du granskar alltid innan spar. AI-anrop kostar per gång (modell ${AI_UNIT_ECONOMICS.model}), ungefär ${AI_UNIT_ECONOMICS.receiptParseSekLow}–${AI_UNIT_ECONOMICS.receiptParseSekHigh} kr per kvitto. Därför begränsar vi AI i gratisplanen och finansierar obegränsat via Pro.`,
	stripeNoteTitle: 'Betalning & villkor',
	stripeNoteBody:
		'Betalning sker via Stripe. Som hushållsägare kan du hantera prenumeration, byta mellan månad och år eller avsluta under Inställningar → Plan. Konsumentvillkor från Stripe gäller vid köp.',
	faqHref: '/faq',
	faqLinkLabel: 'Vanliga frågor'
};

const pricingComingSoonSv: Omit<PricingContent, 'checkoutEnabled'> = {
	...pricingLiveSv,
	lead:
		'Börja gratis med delad lista och skafferi. Pro med statistik och obegränsad kvitto-PDF är på väg — gratisplanen finns redan medan vi finslipar betalning.',
	proStatusNote:
		'Pro är på väg. Betalning är inte aktiverad ännu — du får veta innan något debiteras. Skapa konto gratis och följ med under Inställningar → Plan.',
	meta: {
		...pricingLiveSv.meta,
		description:
			'Generös gratisplan med lager och inköpslista. Pro planeras från cirka 39 kr/mån — betalning aktiveras senare.',
		ogDescription:
			'Jämför Free vs Pro: lager, AI-skannar och kvitto-PDF. Pro är på väg — ingen betalning ännu.'
	},
	proCtaTitle: 'Pro kommer snart',
	proCtaLead:
		'Skapa konto gratis idag. Som hushållsägare kan du lämna din e-post under Inställningar → Plan så hör vi av innan Pro går live.',
	proCtaUpgradeLabel: 'Skapa konto gratis',
	proCtaRegisterLabel: 'Kom igång gratis',
	stripeNoteTitle: 'Betalning senare',
	stripeNoteBody:
		'Betalning via Stripe aktiveras när Pro lanseras. Ingen debitering startar utan att vi meddelat dig i förväg.'
};

const pricingLiveEn: Omit<PricingContent, 'checkoutEnabled'> = {
	...pricingLiveSv,
	title: 'Pricing & plans',
	lead: 'Start free with a shared list and pantry. When the whole household is on board and you want statistics and unlimited receipt PDF, upgrade to Pro — without losing the free tier.',
	proStatusNote:
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
	comparisonRows: pricingLiveSv.comparisonRows.map((row) => ({
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
	aiNoteTitle: 'Why AI limits?',
	aiNoteBody: `Receipt PDF is parsed automatically — you always review before saving. AI calls cost per use (${AI_UNIT_ECONOMICS.model}), about ${AI_UNIT_ECONOMICS.receiptParseSekLow}–${AI_UNIT_ECONOMICS.receiptParseSekHigh} SEK per receipt. Free tier caps AI usage; Pro funds unlimited use.`,
	stripeNoteTitle: 'Billing & terms',
	stripeNoteBody:
		'Payments go through Stripe. As household owner you can manage your subscription, switch monthly/yearly or cancel under Settings → Plan. Stripe consumer terms apply at checkout.',
	faqLinkLabel: 'FAQ'
};

const pricingComingSoonEn: Omit<PricingContent, 'checkoutEnabled'> = {
	...pricingLiveEn,
	lead:
		'Start free with a shared list and pantry. Pro with statistics and unlimited receipt PDF is on the way — the free tier is already here while we finish billing.',
	proStatusNote:
		'Pro is on the way. Billing is not enabled yet — we will tell you before anything is charged. Create a free account and follow along under Settings → Plan.',
	meta: {
		...pricingLiveEn.meta,
		description:
			'Generous free tier with pantry and shopping list. Pro is planned from about 39 SEK/month — billing will be enabled later.',
		ogDescription:
			'Compare Free vs Pro: inventory, AI scans and receipt PDF. Pro is on the way — no billing yet.'
	},
	proCtaTitle: 'Pro coming soon',
	proCtaLead:
		'Create a free account today. As household owner you can leave your email under Settings → Plan and we will reach out before Pro goes live.',
	proCtaUpgradeLabel: 'Create a free account',
	proCtaRegisterLabel: 'Get started free',
	stripeNoteTitle: 'Billing later',
	stripeNoteBody:
		'Stripe billing will be enabled when Pro launches. Nothing is charged until we have told you in advance.'
};

const byLocale: Record<
	MarketingLocale,
	{ live: Omit<PricingContent, 'checkoutEnabled'>; comingSoon: Omit<PricingContent, 'checkoutEnabled'> }
> = {
	sv: { live: pricingLiveSv, comingSoon: pricingComingSoonSv },
	en: { live: pricingLiveEn, comingSoon: pricingComingSoonEn }
};

export function getPricingContent(
	locale: MarketingLocale,
	stripeCheckoutEnabled = false
): PricingContent {
	const pack = byLocale[locale] ?? byLocale.sv;
	const content = stripeCheckoutEnabled ? pack.live : pack.comingSoon;
	return { ...content, checkoutEnabled: stripeCheckoutEnabled };
}
