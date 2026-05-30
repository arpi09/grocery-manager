import {
	AI_UNIT_ECONOMICS,
	FREE_LIMITS,
	PRICE_HYPOTHESIS_SEK,
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
	comingSoonNote: string;
	freeTitle: string;
	proTitle: string;
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
	moreHouseholdMembers: `Upp till ${PRO_LIMITS.maxHouseholdMembers} hushållsmedlemmar`
};

const sv: PricingContent = {
	title: 'Priser & planer',
	lead: 'Home Pantry är gratis att komma igång. Betalning kommer först när vi ser att produkten levererar värde — och du får veta i förväg.',
	comingSoonNote:
		'Ingen betalvägg är aktiv ännu. Alla konton kör Free-planen medan vi finslipar gränser och väntar på rätt tillfälle för prenumeration.',
	freeTitle: 'Gratis',
	proTitle: 'Pro (kommer snart)',
	priceHypothesisTitle: 'Prishypotes',
	priceHypothesisBody: `Vi planerar cirka ${PRICE_HYPOTHESIS_SEK.monthly} kr/månad eller ${PRICE_HYPOTHESIS_SEK.yearly} kr/år — i linje med svenska konkurrenter (${PRICE_HYPOTHESIS_SEK.competitorMonthlyLow}–${PRICE_HYPOTHESIS_SEK.competitorMonthlyHigh} kr/mån).`,
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
		}
	],
	proBullets: Object.values(proFeatureLabelsSv),
	aiNoteTitle: 'Varför gränser?',
	aiNoteBody: `AI-funktioner kostar per anrop (modell ${AI_UNIT_ECONOMICS.model}). En typisk kvitto-PDF kostar ungefär ${AI_UNIT_ECONOMICS.receiptParseSekLow}–${AI_UNIT_ECONOMICS.receiptParseSekHigh} kr i API-avgift — därför begränsar vi AI i gratisplanen och finansierar obegränsat via Pro.`,
	stripeNoteTitle: 'När kommer betalning?',
	stripeNoteBody:
		'Först när retention och efterfrågan motiverar det — vi meddelar i appen och på denna sida innan något debiteras.',
	faqHref: '/faq',
	faqLinkLabel: 'Vanliga frågor',
	fullDocHint: 'Intern produktdokumentation: docs/PRICING.md'
};

const en: PricingContent = {
	...sv,
	title: 'Pricing & plans',
	lead: 'Home Pantry is free to get started. Paid plans come only when the product proves its value — and we will tell you in advance.',
	comingSoonNote:
		'No paywall is active yet. Every account runs the Free plan while we finalize limits and timing for subscriptions.',
	freeTitle: 'Free',
	proTitle: 'Pro (coming soon)',
	priceHypothesisTitle: 'Planned pricing',
	priceHypothesisBody: `We plan around ${PRICE_HYPOTHESIS_SEK.monthly} SEK/month or ${PRICE_HYPOTHESIS_SEK.yearly} SEK/year — in line with Swedish competitors.`,
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
							: 'Smart fill / week'
	})),
	proBullets: [
		'Unlimited AI scanning (barcode, photo)',
		'Unlimited receipt PDF parsing',
		'Unlimited smart shopping list fill',
		'AI insights and full statistics',
		`Up to ${PRO_LIMITS.maxHouseholdMembers} household members`
	],
	aiNoteTitle: 'Why limits?',
	aiNoteBody: `AI features cost per API call (${AI_UNIT_ECONOMICS.model}). A typical receipt PDF costs about ${AI_UNIT_ECONOMICS.receiptParseSekLow}–${AI_UNIT_ECONOMICS.receiptParseSekHigh} SEK — so Free tier caps AI usage and Pro funds unlimited use.`,
	stripeNoteTitle: 'When will billing go live?',
	stripeNoteBody:
		'Only when retention and demand justify it — we will announce in the app and on this page before any charge.',
	faqLinkLabel: 'FAQ',
	fullDocHint: 'Internal product doc: docs/PRICING.md'
};

const byLocale: Record<MarketingLocale, PricingContent> = { sv, en };

export function getPricingContent(locale: MarketingLocale): PricingContent {
	return byLocale[locale] ?? sv;
}
