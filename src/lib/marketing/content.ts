/** Marketing copy — Swedish primary; structure ready for EN locale later. */
export type MarketingLocale = 'sv' | 'en';

export interface MarketingNavLink {
	href: string;
	label: string;
}

export interface MarketingFeature {
	icon: 'barcode' | 'receipt' | 'sparkle' | 'box' | 'home' | 'users';
	title: string;
	description: string;
}

export interface MarketingStep {
	step: number;
	title: string;
	description: string;
}

export interface MarketingFaqItem {
	question: string;
	answer: string;
}

export interface MarketingContent {
	siteName: string;
	tagline: string;
	meta: {
		title: string;
		description: string;
		ogTitle: string;
		ogDescription: string;
	};
	nav: MarketingNavLink[];
	cta: {
		openApp: string;
		login: string;
		register: string;
		tryFree: string;
	};
	landing: {
		heroTitle: string;
		heroLead: string;
		heroSecondary: string;
		featuresTitle: string;
		featuresLead: string;
		stepsTitle: string;
		stepsLead: string;
		finalCtaTitle: string;
		finalCtaLead: string;
	};
	features: {
		title: string;
		lead: string;
		items: MarketingFeature[];
	};
	howItWorks: {
		title: string;
		lead: string;
		steps: MarketingStep[];
	};
	faq: {
		title: string;
		lead: string;
		items: MarketingFaqItem[];
		contactLabel: string;
		contactLead: string;
		contactEmail: string;
	};
	footer: {
		tagline: string;
		rights: string;
	};
}

const sv: MarketingContent = {
	siteName: 'Home Pantry',
	tagline: 'Skanna först. Håll koll på skafferiet. Handla smart.',
	meta: {
		title: 'Home Pantry — Skanna, lagra och handla smart',
		description:
			'Home Pantry hjälper dig hålla koll på kyl, frys och skafferi med streckkodsskanning, utgångsdatum och smart inköpslista.',
		ogTitle: 'Home Pantry — Ditt skafferi i fickan',
		ogDescription:
			'Skanna varor, följ utgångsdatum och fyll på inköpslistan automatiskt. Gratis att komma igång.'
	},
	nav: [
		{ href: '/funktioner', label: 'Funktioner' },
		{ href: '/sa-fungerar-det', label: 'Så fungerar det' },
		{ href: '/faq', label: 'FAQ' }
	],
	cta: {
		openApp: 'Öppna appen',
		login: 'Logga in',
		register: 'Skapa konto',
		tryFree: 'Kom igång gratis'
	},
	landing: {
		heroTitle: 'Skanna först. Slipp gissa vad som finns hemma.',
		heroLead:
			'Home Pantry är byggt kring snabb registrering — streckkod, kvitto eller foto — så du alltid vet vad som finns i kyl, frys och skafferi.',
		heroSecondary:
			'Planera måltider, få varningar innan varor går ut och låt inköpslistan fylla på sig utifrån det du faktiskt har.',
		featuresTitle: 'Allt du behöver i köket',
		featuresLead: 'Från skanning till inköp — utan kalkylark och dubbelköp.',
		stepsTitle: 'Igång på tre steg',
		stepsLead: 'Ingen krånglig setup. Skanna det du har hemma redan idag.',
		finalCtaTitle: 'Redo att ta kontroll över skafferiet?',
		finalCtaLead: 'Logga in eller skapa konto — det tar bara en minut.'
	},
	features: {
		title: 'Funktioner',
		lead: 'Byggt för vardagen i köket — snabbt, tydligt och utan onödig friktion.',
		items: [
			{
				icon: 'barcode',
				title: 'Streckkodsskanning',
				description:
					'Skanna varor på sekunder. Appen fyller i namn och plats så du slipper skriva allt för hand.'
			},
			{
				icon: 'receipt',
				title: 'Kvitto & foto',
				description:
					'Fotografera kvitto eller hyllan — AI hjälper till att tolka och lägga till flera varor på en gång.'
			},
			{
				icon: 'box',
				title: 'Kyl, frys & skafferi',
				description:
					'Se lager per plats med tydliga färger. Filtrera, sök och håll ordning utan att bläddra i lådor.'
			},
			{
				icon: 'sparkle',
				title: 'Smart inköpslista',
				description:
					'Fyll på listan utifrån lager, utgångsdatum och måltidsplan — så du handlar det som faktiskt behövs.'
			},
			{
				icon: 'home',
				title: 'Hushåll tillsammans',
				description:
					'Bjud in familj eller rumskamrater. Alla ser samma skafferi och samma inköpslista i realtid.'
			},
			{
				icon: 'users',
				title: 'Måltidsplan & recept',
				description:
					'Planera veckans mat och få receptidéer utifrån det som redan finns hemma.'
			}
		]
	},
	howItWorks: {
		title: 'Så fungerar det',
		lead: 'Tre enkla steg från kaos i skåpen till full överblick.',
		steps: [
			{
				step: 1,
				title: 'Skanna det du har',
				description:
					'Använd streckkod, kvitto eller foto för att registrera varor i kyl, frys eller skafferi.'
			},
			{
				step: 2,
				title: 'Följ lager & datum',
				description:
					'Se vad som finns, vad som snart går ut och vad som behöver användas först.'
			},
			{
				step: 3,
				title: 'Handla smart',
				description:
					'Fyll på inköpslistan manuellt eller låt appen föreslå det som saknas — sedan är du redo för butiken.'
			}
		]
	},
	faq: {
		title: 'Vanliga frågor',
		lead: 'Svar på det vi oftast får höra. Mer hjälp kommer här framöver.',
		items: [
			{
				question: 'Kostar Home Pantry något?',
				answer:
					'Du kan skapa konto och börja använda appen gratis. Vi meddelar i förväg om betalda planer tillkommer.'
			},
			{
				question: 'Fungerar det utan streckkod?',
				answer:
					'Ja. Du kan lägga till varor manuellt, skanna kvitto eller ta foto om streckkoden saknas.'
			},
			{
				question: 'Kan flera i hushållet använda samma skafferi?',
				answer:
					'Ja. Bjud in medlemmar till ditt hushåll så delar ni lager, inköpslista och måltidsplan.'
			},
			{
				question: 'Var lagras min data?',
				answer:
					'Din data lagras säkert i molnet kopplat till ditt konto. Du kan när som helst ta bort ditt konto i inställningarna.'
			}
		],
		contactLabel: 'Hittar du inte svaret?',
		contactLead: 'Skriv till oss så återkommer vi så snart vi kan.',
		contactEmail: 'hello@homepantry.com'
	},
	footer: {
		tagline: 'Skanna först. Handla smart.',
		rights: '© Home Pantry. Alla rättigheter förbehållna.'
	}
};

const en: MarketingContent = {
	...sv,
	tagline: 'Scan first. Know your pantry. Shop smarter.',
	meta: {
		title: 'Home Pantry — Scan, track and shop smarter',
		description:
			'Home Pantry helps you manage fridge, freezer and cupboard with barcode scanning, expiry dates and a smart shopping list.',
		ogTitle: 'Home Pantry — Your pantry in your pocket',
		ogDescription: 'Scan items, track expiry dates and fill your shopping list automatically. Free to get started.'
	},
	nav: [
		{ href: '/funktioner', label: 'Features' },
		{ href: '/sa-fungerar-det', label: 'How it works' },
		{ href: '/faq', label: 'FAQ' }
	],
	cta: {
		openApp: 'Open app',
		login: 'Log in',
		register: 'Create account',
		tryFree: 'Get started free'
	}
};

const contentByLocale: Record<MarketingLocale, MarketingContent> = { sv, en };

export function getMarketingContent(locale: MarketingLocale = 'sv'): MarketingContent {
	return contentByLocale[locale];
}
