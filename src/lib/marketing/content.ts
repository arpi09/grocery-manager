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

export interface MarketingComparisonRow {
	competitor: string;
	theirStrength: string;
	homePantry: string;
}

export interface MarketingComparison {
	title: string;
	lead: string;
	disclaimer: string;
	themColumn: string;
	usColumn: string;
	rows: MarketingComparisonRow[];
	ctaTitle: string;
	ctaLead: string;
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
		wasteReductionTitle: string;
		wasteReductionLead: string;
		wasteReductionPoints: string[];
		stepsTitle: string;
		stepsLead: string;
		finalCtaTitle: string;
		finalCtaLead: string;
	};
	features: {
		title: string;
		lead: string;
		meta: {
			title: string;
			description: string;
			ogTitle: string;
			ogDescription: string;
		};
		items: MarketingFeature[];
	};
	comparison: MarketingComparison;
	howItWorks: {
		title: string;
		lead: string;
		meta: {
			title: string;
			description: string;
			ogTitle: string;
			ogDescription: string;
		};
		steps: MarketingStep[];
	};
	faq: {
		title: string;
		lead: string;
		meta: {
			title: string;
			description: string;
			ogTitle: string;
			ogDescription: string;
		};
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
	siteName: 'Skaffu',
	tagline: 'Skafferi, kyl och inköp på ett ställe.',
	meta: {
		title: 'Skaffu — skafferi-app för hela hushållet | minska matsvinn',
		description:
			'Skafferi-app med skanning, kvitto-PDF och smart inköpslista. Håll koll på kyl, frys och skafferi — minska matsvinn med utgångsdatum och hushållssync. Gratis att börja.',
		ogTitle: 'Skaffu — skafferi-app som minskar matsvinn',
		ogDescription:
			'Skanna kvitto, följ utgångsdatum och handla smart. Butiksneutralt skafferi för hela hushållet — webb först, gratis att komma igång.'
	},
	nav: [
		{ href: '/funktioner', label: 'Funktioner' },
		{ href: '/sa-fungerar-det', label: 'Så fungerar det' },
		{ href: '/faq', label: 'FAQ' },
		{ href: '/privacy', label: 'Integritet' }
	],
	cta: {
		openApp: 'Öppna appen',
		login: 'Logga in',
		register: 'Skapa konto',
		tryFree: 'Kom igång gratis'
	},
	landing: {
		heroTitle: 'Skaffu — skafferiet du faktiskt har koll på.',
		heroLead:
			'Skaffu är byggt kring snabb registrering — streckkod, kvitto eller foto — så du alltid vet vad som finns i kyl, frys och skafferi.',
		heroSecondary:
			'Planera måltider, få varningar innan varor går ut och låt inköpslistan fylla på sig utifrån det du faktiskt har.',
		featuresTitle: 'Allt du behöver i köket',
		featuresLead: 'Från skanning till inköp — utan kalkylark och dubbelköp.',
		wasteReductionTitle: 'Skafferi-app som hjälper dig minska matsvinn',
		wasteReductionLead:
			'När kyl, frys och skafferi syns på ett ställe blir det lättare att handla rätt mängd, använda det som går ut snart och slippa dubbelköp.',
		wasteReductionPoints: [
			'Utgångsdatum och varningar innan varor hinner bli dåliga.',
			'Recept och inköpslista utifrån det som faktiskt finns hemma.',
			'Kvitto-PDF och skanning — snabb start utan att fylla hela skafferiet manuellt.'
		],
		stepsTitle: 'Igång på tre steg',
		stepsLead: 'Ingen krånglig setup. Skanna det du har hemma redan idag.',
		finalCtaTitle: 'Redo att ta kontroll över skafferiet?',
		finalCtaLead: 'Logga in eller skapa konto — det tar bara en minut.'
	},
	features: {
		title: 'Funktioner',
		lead: 'Byggt för vardagen i köket — snabbt, tydligt och utan onödig friktion.',
		meta: {
			title: 'Funktioner — skanning, kvitto-PDF & smart inköpslista',
			description:
				'Streckkod, kvitto-PDF, utgångsdatum, måltidsplan och hushållssync — butiksneutralt skafferi som kompletterar Bring och Matdags.',
			ogTitle: 'Skaffu funktioner — lager som sanningskälla',
			ogDescription:
				'PDF-kvitto, AI-skannar och inköpslista kopplad till lager. Webb först, utan spelifiering.'
		},
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
					'Fyll på listan utifrån lager, utgångsdatum och måltidsplan — minska matsvinn genom att handla det som faktiskt behövs.'
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
	comparison: {
		title: 'Jämfört med andra appar du redan känner',
		lead: 'Ärlig bild — vi vill inte sälja in något du redan har löst bra. Här är när Skaffu kompletterar eller skiljer sig.',
		disclaimer:
			'Bring!, ICA och Matdags är starka produkter i sina nischer. Vi fokuserar på butiksneutralt skafferi med lager som sanningskälla — inte på stammisrabatter eller gamification.',
		themColumn: 'Det de gör bra',
		usColumn: 'Det Skaffu lägger till',
		rows: [
			{
				competitor: 'Bring!',
				theirStrength:
					'Marknadsledande delad inköpslista och sync mellan familjemedlemmar — enkelt och välkänt i Norden.',
				homePantry:
					'Skafferi, lager per plats, utgångsdatum och skanning så inköpslistan speglar vad som faktiskt finns i kylen — inte bara vad ni tänkt köpa.'
			},
			{
				competitor: 'ICA-appen',
				theirStrength:
					'Gratis för stammisar, erbjudanden, butikskarta och inköpslista kopplad till ICA-handel.',
				homePantry:
					'Ett skafferi för hela hushållet, butiksneutralt — samma lager oavsett kedja, utan att lista och skafferi lever i olika världar.'
			},
			{
				competitor: 'Matdags',
				theirStrength:
					'Liknande löfte i Sverige: foto, kvitto, streckkod, påminnelser och recept från det du har hemma.',
				homePantry:
					'Webb först, PDF-kvitto, måltidsplan kopplad till lager och hushållssync — utan krav på spelifiering eller att byta till native-app dag ett.'
			}
		],
		ctaTitle: 'Prova butiksneutralt skafferi',
		ctaLead: 'Öppna appen eller logga in — kom igång med ett kvitto eller några streckkoder.'
	},
	howItWorks: {
		title: 'Så fungerar det',
		lead: 'Tre enkla steg från kaos i skåpen till full överblick.',
		meta: {
			title: 'Så fungerar Skaffu — skafferi-app i tre steg',
			description:
				'Skanna varor, följ utgångsdatum och handla smart. Så kommer du igång med Skaffu — skafferi-appen som hjälper dig minska matsvinn.',
			ogTitle: 'Så fungerar Skaffu — från skanning till smart inköp',
			ogDescription:
				'Streckkod, kvitto eller foto → lager per plats → inköpslista. Tre steg till bättre koll på skafferiet.'
		},
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
		meta: {
			title: 'FAQ — Skaffu skafferi-app',
			description:
				'Vanliga frågor om Skaffu: pris, streckkod, hushållssync, AI och dataskydd. Skafferi-app för att minska matsvinn.',
			ogTitle: 'Skaffu FAQ — skafferi, pris och integritet',
			ogDescription:
				'Svar om gratisplan, kvittoskanning, hushåll och GDPR. Kontakta hello@skaffu.com vid fler frågor.'
		},
		items: [
			{
				question: 'Hur hjälper Skaffu mig minska matsvinn?',
				answer:
					'Skaffu är en skafferi-app byggd kring lager som sanningskälla: du ser utgångsdatum, får varningar innan varor går ut och kan låta recept och inköpslista utgå från det som redan finns hemma — så mindre mat kastas och färre dubbelköp.'
			},
			{
				question: 'Kostar Skaffu något?',
				answer:
					'Du kan skapa konto och använda appen gratis med en generös kärnplan (lager, manuell lista, två hushållsmedlemmar). AI-tunga funktioner får begränsningar i gratisplanen; en Pro-plan med obegränsad AI och fler medlemmar kommer senare — vi meddelar i förväg innan något debiteras. Läs mer på /priser.'
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
					'Din data lagras säkert i molnet kopplat till ditt konto och hushåll. Läs mer i vår integritetspolicy — där beskriver vi även AI och dina GDPR-rättigheter.'
			},
			{
				question: 'Hur används AI i appen?',
				answer:
					'AI (OpenAI) hjälper till att tolka kvitto, föreslå varor och ge inköps- och receptidéer. Vi skickar bara det som behövs för funktionen och använder API på ett sätt som inte tränar OpenAI:s modeller. Se integritetspolicyn för detaljer.'
			},
			{
				question: 'Kan jag lägga till Skaffu på hemskärmen?',
				answer:
					'Ja. Öppna appen i Safari (iPhone) eller Chrome (Android) och välj Lägg till på hemskärmen / Installera app. I appen under Inställningar → Lägg till på hemskärmen finns steg-för-steg-guide. På dator fungerar appen i webbläsaren.'
			}
		],
		contactLabel: 'Hittar du inte svaret?',
		contactLead: 'Skriv till oss så återkommer vi så snart vi kan.',
		contactEmail: 'hello@skaffu.com'
	},
	footer: {
		tagline: 'Skafferi, kyl och inköp på ett ställe.',
		rights: '© Skaffu. Alla rättigheter förbehållna.'
	}
};

const en: MarketingContent = {
	...sv,
	tagline: 'Pantry, fridge and shopping in one place.',
	meta: {
		title: 'Skaffu — pantry app for the whole household | reduce food waste',
		description:
			'Pantry app with scanning, receipt PDF and smart shopping list. Track fridge, freezer and cupboard — reduce food waste with expiry dates and household sync. Free to start.',
		ogTitle: 'Skaffu — pantry app that reduces food waste',
		ogDescription:
			'Scan receipts, track expiry dates and shop smart. Store-neutral pantry for the whole household — web-first, free to get started.'
	},
	nav: [
		{ href: '/funktioner', label: 'Features' },
		{ href: '/sa-fungerar-det', label: 'How it works' },
		{ href: '/faq', label: 'FAQ' },
		{ href: '/privacy', label: 'Privacy' }
	],
	cta: {
		openApp: 'Open app',
		login: 'Log in',
		register: 'Create account',
		tryFree: 'Get started free'
	},
	comparison: {
		title: 'Compared to apps you may already use',
		lead: 'An honest view — we are not here to replace what already works for you. Here is when Skaffu complements or differs.',
		disclaimer:
			'Bring!, ICA and Matdags are strong in their niches. We focus on a store-neutral pantry with inventory as source of truth — not loyalty discounts or gamification.',
		themColumn: 'What they do well',
		usColumn: 'What Skaffu adds',
		rows: [
			{
				competitor: 'Bring!',
				theirStrength:
					'Market-leading shared shopping lists and family sync — simple and familiar in the Nordics.',
				homePantry:
					'Pantry inventory by location, expiry dates and scanning so the list reflects what is actually in the fridge — not just what you plan to buy.'
			},
			{
				competitor: 'ICA app',
				theirStrength: 'Free for loyalty members, offers, store maps and a shopping list tied to ICA.',
				homePantry:
					'One household pantry, store-neutral — same inventory whether you shop ICA, Willys or Lidl, without list and pantry living in separate worlds.'
			},
			{
				competitor: 'Matdags',
				theirStrength:
					'Similar promise in Sweden: photo, receipt, barcode, reminders and recipes from what you have at home.',
				homePantry:
					'Web-first, PDF receipts, meal plan tied to inventory and household sync — without gamification or switching to a native app on day one.'
			}
		],
		ctaTitle: 'Try a store-neutral pantry',
		ctaLead: 'Open the app or log in — start with one receipt or a few barcodes.'
	},
	landing: {
		heroTitle: 'Skaffu — the pantry you actually keep track of.',
		heroLead:
			'Skaffu is built around fast capture — barcode, receipt or photo — so you always know what is in fridge, freezer and cupboard.',
		heroSecondary:
			'Plan meals, get warnings before items expire, and let the shopping list fill from what you actually have.',
		featuresTitle: 'Everything you need in the kitchen',
		featuresLead: 'From scanning to shopping — without spreadsheets and duplicate buys.',
		wasteReductionTitle: 'Pantry app that helps you reduce food waste',
		wasteReductionLead:
			'When fridge, freezer and cupboard are visible in one place it is easier to buy the right amount, use items before they expire and avoid duplicate purchases.',
		wasteReductionPoints: [
			'Expiry dates and warnings before food goes bad.',
			'Recipes and shopping list based on what you actually have at home.',
			'Receipt PDF and scanning — quick start without manually filling the whole pantry.'
		],
		stepsTitle: 'Up and running in three steps',
		stepsLead: 'No complicated setup. Scan what you have at home today.',
		finalCtaTitle: 'Ready to take control of your pantry?',
		finalCtaLead: 'Log in or create an account — it only takes a minute.'
	},
	features: {
		title: 'Features',
		lead: 'Built for everyday kitchen use — fast, clear and low friction.',
		meta: {
			title: 'Features — scanning, receipt PDF & smart shopping list',
			description:
				'Barcode, receipt PDF, expiry dates, meal plan and household sync — store-neutral pantry that complements Bring and Matdags.',
			ogTitle: 'Skaffu features — inventory as source of truth',
			ogDescription:
				'PDF receipts, AI scans and shopping list tied to inventory. Web-first, without gamification.'
		},
		items: [
			{
				icon: 'barcode',
				title: 'Barcode scanning',
				description: 'Scan items in seconds. The app fills in name and location so you type less.'
			},
			{
				icon: 'receipt',
				title: 'Receipt & photo',
				description: 'Photograph a receipt or shelf — AI helps parse and add multiple items at once.'
			},
			{
				icon: 'box',
				title: 'Fridge, freezer & cupboard',
				description: 'See stock by location with clear colours. Filter, search and stay organised.'
			},
			{
				icon: 'sparkle',
				title: 'Smart shopping list',
				description: 'Fill the list from inventory, expiry dates and meal plan — shop what you actually need.'
			},
			{
				icon: 'home',
				title: 'Household together',
				description: 'Invite family or roommates. Everyone sees the same pantry and shopping list in real time.'
			},
			{
				icon: 'users',
				title: 'Meal plan & recipes',
				description: 'Plan the week and get recipe ideas from what is already at home.'
			}
		]
	},
	howItWorks: {
		title: 'How it works',
		lead: 'Three simple steps from messy cupboards to full overview.',
		meta: {
			title: 'How Skaffu works — pantry app in three steps',
			description:
				'Scan items, track expiry dates and shop smart. Get started with Skaffu — the pantry app that helps reduce food waste.',
			ogTitle: 'How Skaffu works — from scanning to smart shopping',
			ogDescription:
				'Barcode, receipt or photo → inventory by location → shopping list. Three steps to a better pantry.'
		},
		steps: [
			{
				step: 1,
				title: 'Scan what you have',
				description: 'Use barcode, receipt or photo to register items in fridge, freezer or cupboard.'
			},
			{
				step: 2,
				title: 'Track stock & dates',
				description: 'See what you have, what expires soon and what to use first.'
			},
			{
				step: 3,
				title: 'Shop smart',
				description: 'Fill the shopping list manually or let the app suggest what is missing — then head to the store.'
			}
		]
	},
	faq: {
		title: 'Frequently asked questions',
		lead: 'Answers to what we hear most often. More help will appear here over time.',
		meta: {
			title: 'FAQ — Skaffu pantry app',
			description:
				'Common questions about Skaffu: pricing, barcodes, household sync, AI and privacy. Pantry app to reduce food waste.',
			ogTitle: 'Skaffu FAQ — pantry, pricing and privacy',
			ogDescription:
				'Answers about the free plan, receipt scanning, households and GDPR. Contact hello@skaffu.com for more.'
		},
		items: [
			{
				question: 'How does Skaffu help me reduce food waste?',
				answer:
					'Skaffu is a pantry app built around inventory as source of truth: you see expiry dates, get warnings before items go bad, and can base recipes and shopping lists on what is already at home — so less food is thrown away and fewer duplicate buys.'
			},
			{
				question: 'Does Skaffu cost anything?',
				answer:
					'You can create an account and use the app free on a generous core plan (inventory, manual list, two household members). AI-heavy features will have limits on the free plan; a Pro plan with unlimited AI and more members is coming later — we will notify you before any charge. See /priser for more.'
			},
			{
				question: 'Does it work without a barcode?',
				answer: 'Yes. Add items manually, scan a receipt or take a photo when the barcode is missing.'
			},
			{
				question: 'Can several people in the household share one pantry?',
				answer: 'Yes. Invite members to your household to share inventory, shopping list and meal plan.'
			},
			{
				question: 'Where is my data stored?',
				answer:
					'Your data is stored securely in the cloud linked to your account and household. See our privacy policy for AI and GDPR details.'
			},
			{
				question: 'How is AI used in the app?',
				answer:
					'AI (OpenAI) helps parse receipts, suggest items and give shopping and recipe ideas. We only send what is needed for the feature and use the API in a way that does not train OpenAI models. See the privacy policy for details.'
			},
			{
				question: 'Can I add Skaffu to my home screen?',
				answer:
					'Yes. Open the app in Safari (iPhone) or Chrome (Android) and choose Add to Home Screen / Install app. In the app, go to Settings → Add to home screen for step-by-step instructions. On desktop, use the app in your browser.'
			}
		],
		contactLabel: 'Cannot find your answer?',
		contactLead: 'Email us and we will get back to you as soon as we can.',
		contactEmail: 'hello@skaffu.com'
	},
	footer: {
		tagline: 'Pantry, fridge and shopping in one place.',
		rights: '© Skaffu. All rights reserved.'
	}
};

const contentByLocale: Record<MarketingLocale, MarketingContent> = { sv, en };

export function getMarketingContent(locale: MarketingLocale = 'sv'): MarketingContent {
	return contentByLocale[locale];
}
