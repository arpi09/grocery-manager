/** Marketing copy — Swedish primary; structure ready for EN locale later. */
export type MarketingLocale = 'sv' | 'en';

export interface MarketingNavLink {
	href: string;
	label: string;
	external?: boolean;
}

export interface MarketingDashboardCard {
	title: string;
	href: string;
	previewLines: string[];
}

export interface MarketingFooterSection {
	title: string;
	links: MarketingNavLink[];
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

export interface MarketingStat {
	value: string;
	label: string;
}

export interface MarketingDifferentiator {
	title: string;
	description: string;
	tag: string;
}

export interface MarketingFaqItem {
	question: string;
	answer: string;
}

export interface MarketingComparisonRow {
	competitor: string;
	theirStrength: string;
	skaffu: string;
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

export interface MarketingProLaunch {
	badge: string;
	title: string;
	lead: string;
	bullets: string[];
	priceFrom: string;
	ctaPricing: string;
	ctaFree: string;
}

export interface MarketingContent {
	siteName: string;
	tagline: string;
	proLaunch: MarketingProLaunch;
	meta: {
		title: string;
		description: string;
		ogTitle: string;
		ogDescription: string;
	};
	nav: MarketingNavLink[];
	header: {
		navAria: string;
		navMobileAria: string;
		menuToggle: string;
	};
	cta: {
		openApp: string;
		login: string;
		register: string;
		tryFree: string;
		createWeeklyList: string;
	};
	landing: {
		heroDomainSuffix: string;
		heroEyebrow: string;
		heroTitle: string;
		heroLead: string;
		heroSecondary: string;
		heroHighlightsAria: string;
		heroHighlights: {
			list: string;
			partner: string;
			eatFirst: string;
		};
		statsAria: string;
		seeAllFeatures: string;
		wasteMeterLabel: string;
		wasteMeterCaption: string;
		comparisonKicker: string;
		readHowItWorks: string;
		stats: MarketingStat[];
		differentiatorsTitle: string;
		differentiatorsLead: string;
		differentiators: MarketingDifferentiator[];
		featuresTitle: string;
		featuresLead: string;
		wasteReductionTitle: string;
		wasteReductionLead: string;
		wasteReductionPoints: string[];
		stepsTitle: string;
		stepsLead: string;
		stepsKicker: string;
		finalCtaTitle: string;
		finalCtaLead: string;
		guidesTeaserTitle: string;
		guidesTeaserLead: string;
		guidesTeaserSeeAll: string;
		guidesTeaserReadMore: string;
		scanCtaLabel: string;
		dashboardCardsTitle: string;
		dashboardCardsLead: string;
		dashboardCardsSeeMore: string;
		dashboardCards: MarketingDashboardCard[];
		heroVisual: {
			listTitle: string;
			listItemChecked: string;
			listItemPending: string;
			listItemPending2: string;
			suggestionText: string;
			suggestionBadge: string;
			eatFirstBadge: string;
			eatFirstCaption: string;
			shareLink: string;
			shopTogether: string;
			memberAvatars: string;
		};
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
		pricingLinkLabel: string;
		contactLabel: string;
		contactLead: string;
		contactEmail: string;
	};
	footer: {
		tagline: string;
		rights: string;
		navAria: string;
		socialLabel: string;
		sections: MarketingFooterSection[];
		socialLinks: MarketingNavLink[];
	};
	reduceWaste: MarketingSeoPage;
	pantryApp: MarketingSeoPage;
	receiptGuide: MarketingSeoPage;
	guidesHub: {
		kicker: string;
		title: string;
		lead: string;
		empty: string;
		readMore: string;
		backToList: string;
		ctaTitle: string;
		ctaLead: string;
		meta: {
			title: string;
			description: string;
			ogTitle: string;
			ogDescription: string;
		};
	};
}

export interface MarketingSeoPage {
	title: string;
	lead: string;
	meta: {
		title: string;
		description: string;
		ogTitle: string;
		ogDescription: string;
	};
	points: string[];
	steps?: MarketingStep[];
	faq?: MarketingFaqItem[];
	relatedHref?: string;
	relatedLabel?: string;
}

const FAQ_COST_QUESTIONS = new Set(['Kostar Skaffu något?', 'Does Skaffu cost anything?']);

const proLaunchLiveSv: MarketingProLaunch = {
	badge: 'Pro är live',
	title: 'Mer plats när hela hushållet är med',
	lead:
		'Pro ger plats för fler i hushållet, full statistik på handeln och obegränsad kvitto-PDF. Gratisplanen finns kvar om du vill prova i lugn och ro.',
	bullets: [
		'Full statistik — följ handeln och kvitton per hushåll',
		'Obegränsad kvitto-PDF — ladda upp och granska utan tak',
		'Upp till 6 hushållsmedlemmar',
		'Smarta veckoförslag och listfyllning',
		'Från cirka 39 kr/mån — uppgradera när du är redo'
	],
	priceFrom: 'från 39 kr/mån',
	ctaPricing: 'Se Pro & priser',
	ctaFree: 'Kom igång gratis'
};

const proLaunchComingSoonSv: MarketingProLaunch = {
	badge: 'Pro på väg',
	title: 'Mer plats när hela hushållet är med',
	lead:
		'Pro kommer snart med plats för fler i hushållet, full statistik och obegränsad kvitto-PDF. Gratisplanen finns redan — prova i lugn och ro medan vi finslipar betalning.',
	bullets: [
		'Full statistik — följ handeln och kvitton per hushåll',
		'Obegränsad kvitto-PDF — ladda upp och granska utan tak',
		'Upp till 6 hushållsmedlemmar',
		'Smarta veckoförslag och listfyllning',
		'Planerat från cirka 39 kr/mån — ingen betalning ännu'
	],
	priceFrom: 'planeras från 39 kr/mån',
	ctaPricing: 'Se vad Pro inkluderar',
	ctaFree: 'Kom igång gratis'
};

const proLaunchLiveEn: MarketingProLaunch = {
	badge: 'Pro is live',
	title: 'More room when the whole household joins',
	lead:
		'Pro adds room for more household members, full shopping statistics and unlimited receipt PDF. The free plan is still there if you want to try at your own pace.',
	bullets: [
		'Full statistics — track shopping and receipts for the household',
		'Unlimited receipt PDF — upload and review without caps',
		'Up to 6 household members',
		'Smart weekly suggestions and list fill',
		'From about 39 SEK/month — upgrade when you are ready'
	],
	priceFrom: 'from 39 SEK/month',
	ctaPricing: 'See Pro & pricing',
	ctaFree: 'Get started free'
};

const proLaunchComingSoonEn: MarketingProLaunch = {
	badge: 'Pro coming soon',
	title: 'More room when the whole household joins',
	lead:
		'Pro is on the way with room for more household members, full statistics and unlimited receipt PDF. The free plan is already here — try at your own pace while we finish billing.',
	bullets: [
		'Full statistics — track shopping and receipts for the household',
		'Unlimited receipt PDF — upload and review without caps',
		'Up to 6 household members',
		'Smart weekly suggestions and list fill',
		'Planned from about 39 SEK/month — no billing yet'
	],
	priceFrom: 'planned from 39 SEK/month',
	ctaPricing: 'See what Pro includes',
	ctaFree: 'Get started free'
};

const faqCostAnswerLiveSv =
	'Du kan skapa konto och använda appen gratis med en generös kärnplan (skafferi, manuell lista, två hushållsmedlemmar). Pro (~39 kr/mån) ger obegränsad AI, kvitto-PDF, statistik och fler hushållsmedlemmar — uppgradera under Inställningar när du vill. Läs mer på /priser.';

const faqCostAnswerComingSoonSv =
	'Du kan skapa konto och använda appen gratis med en generös kärnplan (skafferi, manuell lista, två hushållsmedlemmar). Pro (~39 kr/mån) är på väg med obegränsad AI, kvitto-PDF, statistik och fler hushållsmedlemmar — betalning aktiveras senare. Läs mer på /priser.';

const faqCostAnswerLiveEn =
	'You can create an account and use the app free on a generous core plan (pantry, manual list, two household members). Pro (~39 SEK/month) adds unlimited AI, receipt PDF, statistics and more household members — upgrade in Settings when you want. See /priser for more.';

const faqCostAnswerComingSoonEn =
	'You can create an account and use the app free on a generous core plan (pantry, manual list, two household members). Pro (~39 SEK/month) is on the way with unlimited AI, receipt PDF, statistics and more household members — billing is not enabled yet. See /priser for more.';

const sv: MarketingContent = {
	siteName: 'Skaffu',
	tagline: 'Gemensam veckohandel med matkoll — handla ihop, släng mindre.',
	meta: {
		title: 'Skaffu — skafferi-app och inköpslista för hela hushållet',
		description:
			'Skaffu är skafferi-appen för hela hushållet: delad inköpslista, kvitto-PDF och koll på utgångsdatum. Handla ihop butiksneutralt — gratis att börja.',
		ogTitle: 'Skaffu — skafferi-app med gemensam inköpslista',
		ogDescription:
			'Delad lista, utgångsdatum och veckoförslag från Skaffu. Handla ihop i butiken — webb först, butiksneutralt.'
	},
	nav: [
		{ href: '/funktioner', label: 'Produkt' },
		{ href: '/priser', label: 'Priser' },
		{ href: '/guider', label: 'Guider' },
		{ href: '/faq', label: 'FAQ' }
	],
	header: {
		navAria: 'Webbplats',
		navMobileAria: 'Webbplats mobil',
		menuToggle: 'Meny'
	},
	cta: {
		openApp: 'Öppna appen',
		login: 'Logga in',
		register: 'Skapa konto',
		tryFree: 'Kom igång gratis',
		createWeeklyList: 'Skapa veckans lista'
	},
	proLaunch: proLaunchLiveSv,
	landing: {
		heroDomainSuffix: '· skaffu.com',
		heroEyebrow: 'Skafferi-app för hela hushållet',
		heroTitle: 'Skaffu — handla ihop med koll på skafferiet.',
		heroLead:
			'Delad inköpslista och skafferi för hela hushållet — bjud in partner, checka av i butiken och se vad som finns hemma innan ni handlar.',
		heroSecondary:
			'Kvitton och checkoffs hjälper Skaffu föreslå veckans lista. Butiksneutralt — ICA, Willys eller Coop.',
		heroHighlightsAria: 'Det viktigaste',
		heroHighlights: {
			list: 'Delad lista i realtid',
			partner: 'Bjud in partner',
			eatFirst: 'Se vad som går ut snart'
		},
		statsAria: 'Skaffu i siffror',
		seeAllFeatures: 'Se alla funktioner',
		wasteMeterLabel: 'Mindre matsvinn',
		wasteMeterCaption: 'Veckan fixad — utgående varor blir middag och inköpslista på ett klick.',
		comparisonKicker: 'Jämfört med Bring & ICA',
		readHowItWorks: 'Se hur det fungerar',
		stats: [
			{ value: '1', label: 'gemensam lista — slipp dubbelköp när ni handlar ihop' },
			{ value: '↓', label: 'mindre svinn — se vad som går ut innan det blir dåligt' },
			{ value: 'kr', label: 'följ handeln i statistik — kvitton och vanor samlade' }
		],
		differentiatorsTitle: 'Byggt för hushåll som handlar ihop',
		differentiatorsLead:
			'En delad veckolista som lär sig era vanor — från kvitton och checkoffs till veckoförslag, inte bara en tom lista.',
		differentiators: [
			{
				tag: 'Veckolista',
				title: 'Lista tillsammans',
				description:
					'Delad inköpslista i realtid — bjud in partner, checka av i butiken och slipp dubbelköp.'
			},
			{
				tag: 'Veckoförslag',
				title: 'Skaffu föreslår',
				description:
					'Kvitton och checkoffs ger veckoförslag på vad ni brukar behöva — mindre gissning inför handeln.'
			},
			{
				tag: 'Ät det först',
				title: 'Mindre svinn hemma',
				description:
					'Se vad som går ut snart och prioritera det i veckoplanen — innan maten hamnar i soporna.'
			},
			{
				tag: 'Butiksneutral',
				title: 'Samma lista överallt',
				description:
					'ICA, Willys, Coop eller Lidl — ett hushåll, en lista. Ingen kedja låser in er data.'
			}
		],
		featuresTitle: 'Det ni behöver i köket',
		featuresLead: 'Från gemensam lista till matkoll — snabbt, tydligt och utan krångel.',
		wasteReductionTitle: 'Mindre svinn när listan vet vad som finns',
		wasteReductionLead:
			'När Skaffu känner era vanor blir det lättare att handla rätt mängd, använda det som går ut snart och minska matsvinn hemma.',
		wasteReductionPoints: [
			'Utgångsdatum och varningar innan varor hinner bli dåliga.',
			'Veckoförslag och recept utifrån det som faktiskt finns hemma.',
			'Kvitto-PDF och checkoffs — så nästa veckas lista träffar rätt.'
		],
		stepsTitle: 'Veckohandel på tre steg',
		stepsLead: 'Från gemensam lista till mindre svinn — utan krånglig setup.',
		stepsKicker: 'Så fungerar det',
		finalCtaTitle: 'Redo att skapa veckans lista?',
		finalCtaLead: 'Skapa veckans lista gratis — bjud in partner och handla ihop redan idag.',
		guidesTeaserTitle: 'Senaste guider',
		guidesTeaserLead:
			'Praktiska artiklar om skafferi, matsvinn och kvitto-PDF — skrivna för svenska hushåll.',
		guidesTeaserSeeAll: 'Alla guider',
		guidesTeaserReadMore: 'Läs guiden',
		scanCtaLabel: 'Kom igång — skanna kvitto eller bygg lista',
		dashboardCardsTitle: 'Koll på skafferiet och veckans handel',
		dashboardCardsLead:
			'Tre vardagsytor i appen — klicka för att läsa mer om skafferi, inköpslista och det som går ut snart.',
		dashboardCardsSeeMore: 'Visa mer',
		dashboardCards: [
			{
				title: 'Skafferi',
				href: '/skafferi-app',
				previewLines: ['24 varor i hushållet', 'Kyl 12 · Frys 3 · Skafferi 9']
			},
			{
				title: 'Inköp',
				href: '/funktioner',
				previewLines: ['5 saker på listan', 'Ni brukar handla på lördag']
			},
			{
				title: 'Går ut snart',
				href: '/minska-matsvinn',
				previewLines: ['Mjölk — imorgon', 'Yoghurt — om 2 dagar', 'Tomater — om 3 dagar']
			}
		],
		heroVisual: {
			listTitle: 'Veckans lista',
			listItemChecked: 'Anna checkade mjölk',
			listItemPending: 'Tomater',
			listItemPending2: 'Pasta',
			suggestionText: 'Skaffu föreslår: Yoghurt',
			suggestionBadge: 'Från dina kvitton',
			eatFirstBadge: 'Ät det först',
			eatFirstCaption: '3 varor går ut — ät först',
			shareLink: 'Dela länk',
			shopTogether: 'Handla tillsammans',
			memberAvatars: 'A · E'
		}
	},
	features: {
		title: 'Funktioner',
		lead: 'Byggt för vardagen i köket — snabbt, tydligt och utan onödig friktion.',
		meta: {
			title: 'Funktioner — kvitto-PDF, statistik & smart inköpslista | Skaffu',
			description:
				'Streckkod, kvitto-PDF, utgångsdatum, veckoförslag och statistik på handeln — butiksneutral skafferi-app som kompletterar Bring och Matdags.',
			ogTitle: 'Skaffu funktioner — skafferi, lista och kvitto-PDF',
			ogDescription:
				'PDF-kvitto med granskning, veckoförslag och inköpslista kopplad till skafferiet. Webb först, utan spelifiering.'
		},
		items: [
			{
				icon: 'home',
				title: 'Hushåll tillsammans',
				description:
					'Bjud in familj eller rumskamrater. Alla ser samma inköpslista i realtid — handla ihop i butiken.'
			},
			{
				icon: 'sparkle',
				title: 'Smart inköpslista',
				description:
					'Gemensam veckolista med veckoförslag — checka av tillsammans och slipp dubbelköp.'
			},
			{
				icon: 'sparkle',
				title: 'Veckoförslag',
				description:
					'Skaffu föreslår vad ni brukar behöva nästa vecka — utifrån kvitton, checkoffs och vanor.'
			},
			{
				icon: 'receipt',
				title: 'Kvitto-PDF',
				description:
					'Ladda upp digitalt kvitto från Kivra, ICA eller Willys. Du granskar raderna innan de sparas i skafferiet.'
			},
			{
				icon: 'users',
				title: 'Statistik',
				description:
					'Följ handeln och kvitton per hushåll — se mönster i vad ni köper och när ni handlar.'
			},
			{
				icon: 'box',
				title: 'Ät det först',
				description:
					'Se vad som går ut snart hemma och handla bara det som saknas — mindre svinn, rätt köp.'
			},
			{
				icon: 'barcode',
				title: 'Streckkodsskanning',
				description:
					'Skanna varor på sekunder. Appen fyller i namn och plats så du slipper skriva allt för hand.'
			},
			{
				icon: 'users',
				title: 'Veckoplan & recept',
				description:
					'Planera veckans mat under Planer och få receptidéer under Äta — utifrån det som redan finns hemma.'
			}
		]
	},
	comparison: {
		title: 'Jämfört med andra appar du redan känner',
		lead: 'Ärlig bild — vi vill inte sälja in något du redan har löst bra. Här är när Skaffu kompletterar eller skiljer sig.',
		disclaimer:
			'Bring!, ICA och Matdags är starka produkter i sina nischer. Vi fokuserar på gemensam veckolista och skafferi i samma app — butiksneutralt — inte på stammisrabatter eller gamification.',
		themColumn: 'Det de gör bra',
		usColumn: 'Det Skaffu lägger till',
		rows: [
			{
				competitor: 'Bring!',
				theirStrength:
					'Marknadsledande delad inköpslista och sync mellan familjemedlemmar — enkelt och välkänt i Norden.',
				skaffu:
					'Samma delade lista — plus skafferi, utgångsdatum och Ät det först så ni handlar utifrån vad som faktiskt finns hemma.'
			},
			{
				competitor: 'ICA-appen',
				theirStrength:
					'Gratis för stammisar, erbjudanden, butikskarta och inköpslista kopplad till ICA-handel.',
				skaffu:
					'Ett skafferi för hela hushållet, butiksneutralt — samma överblick oavsett kedja, utan att lista och skafferi lever i olika världar.'
			},
			{
				competitor: 'Matdags',
				theirStrength:
					'Liknande löfte i Sverige: foto, kvitto, streckkod, påminnelser och recept från det du har hemma.',
				skaffu:
					'Webb först, kvitto-PDF med granskning, veckoplan kopplad till skafferiet och hushållssync — utan krav på native-app dag ett.'
			}
		],
		ctaTitle: 'Prova butiksneutralt skafferi',
		ctaLead: 'Skapa lista och bjud in partner — kom igång på en minut.'
	},
	howItWorks: {
		title: 'Så fungerar det',
		lead: 'Från konto till veckoförslag — samma flöde som onboarding i appen.',
		meta: {
			title: 'Så fungerar Skaffu — skafferi-app i tre steg',
			description:
				'Skapa konto, bjud in partner och bygg skafferi med kvitto eller lista. Så kommer du igång med Skaffu — skafferi-appen som hjälper dig minska matsvinn.',
			ogTitle: 'Så fungerar Skaffu — från konto till veckoförslag',
			ogDescription:
				'Konto → bjud in → lista och kvitto → handla ihop. Tre steg till bättre koll på skafferiet.'
		},
		steps: [
			{
				step: 1,
				title: 'Skapa konto och bjud in',
				description:
					'Skapa konto, sätt upp hushållet och bjud in partner — alla ser samma inköpslista i realtid.'
			},
			{
				step: 2,
				title: 'Bygg lista och skafferi',
				description:
					'Lägg till veckans varor, ladda upp kvitto-PDF eller skanna streckkod. Du granskar alltid innan det sparas.'
			},
			{
				step: 3,
				title: 'Handla ihop — nästa vecka föreslår Skaffu',
				description:
					'Checka av i butiken medan partnern lägger till saker hemma. Nästa vecka får ni veckoförslag utifrån vanor och utgående varor.'
			}
		]
	},
	faq: {
		title: 'Vanliga frågor',
		lead: 'Svar på det vi oftast får höra om Skaffu, priser och integritet.',
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
					'Skaffu är en skafferi-app där ni ser vad som finns hemma: utgångsdatum, varningar innan varor går ut och veckoförslag utifrån det ni redan har. Recept och inköpslista kan byggas på samma skafferi — så mindre mat kastas och färre dubbelköp.'
			},
			{
				question: 'Kostar Skaffu något?',
				answer:
					'Du kan skapa konto och använda appen gratis med en generös kärnplan (skafferi, manuell lista, två hushållsmedlemmar). Pro (~39 kr/mån) ger obegränsad AI, kvitto-PDF, statistik och fler hushållsmedlemmar — uppgradera under Inställningar när du vill. Läs mer på /priser.'
			},
			{
				question: 'Fungerar det utan streckkod?',
				answer:
					'Ja. Du kan lägga till varor manuellt, ladda upp kvitto-PDF eller ta foto om streckkoden saknas.'
			},
			{
				question: 'Kan flera i hushållet använda samma skafferi?',
				answer:
					'Ja. Bjud in medlemmar till ditt hushåll så delar ni skafferi, inköpslista och veckoplan.'
			},
			{
				question: 'Vad visar statistik i Skaffu?',
				answer:
					'Under Statistik ser hushållet aggregerad handel och kvittomönster — vad ni köper ofta, hur mycket som går ut och trender över tid. Pro ger full tillgång; gratisplanen har grundläggande insikter.'
			},
			{
				question: 'Var lagras min data?',
				answer:
					'Din data lagras säkert i molnet kopplat till ditt konto och hushåll. Läs mer i vår integritetspolicy — där beskriver vi även AI och dina GDPR-rättigheter.'
			},
			{
				question: 'Hur används AI i appen?',
				answer:
					'AI (OpenAI) hjälper till att tolka kvitto-PDF, föreslå varor och ge inköps- och receptidéer. Vi skickar bara det som behövs för funktionen och använder API på ett sätt som inte tränar OpenAI:s modeller. Se integritetspolicyn för detaljer.'
			},
			{
				question: 'Kan jag dela utgående varor med grannar?',
				answer:
					'Ja — grannskafferiet (beta) låter dig skapa en tidsbegränsad länk (48 timmar) med varor som går ut snart, utan adress eller geo. Mottagaren ser bara varunamn och utgångsdatum. Prova under /grannskafferiet i appen.'
			},
			{
				question: 'Kan jag lägga till Skaffu på hemskärmen?',
				answer:
					'Ja. Öppna appen i Safari (iPhone) eller Chrome (Android) och välj Lägg till på hemskärmen / Installera app. I appen under Inställningar → Lägg till på hemskärmen finns steg-för-steg-guide. På dator fungerar appen i webbläsaren.'
			},
			{
				question: 'Hur raderar jag mitt konto?',
				answer:
					'Gå till Inställningar → Konto → Radera mitt konto. Hushållsägare kan även ta bort hela hushållet under Inställningar → Hushåll. Raderingen är permanent — se integritetspolicyn för detaljer om datalagring.'
			}
		],
		pricingLinkLabel: 'Priser & planer',
		contactLabel: 'Hittar du inte svaret?',
		contactLead: 'Skriv till oss så återkommer vi så snart vi kan.',
		contactEmail: 'hello@skaffu.com'
	},
	footer: {
		tagline: 'Skafferi-app och inköpslista för hela hushållet.',
		rights: '© Skaffu. Alla rättigheter förbehållna.',
		navAria: 'Sidfot',
		socialLabel: 'Följ oss',
		sections: [
			{
				title: 'Produkt',
				links: [
					{ href: '/funktioner', label: 'Funktioner' },
					{ href: '/sa-fungerar-det', label: 'Så fungerar det' }
				]
			},
			{
				title: 'Användning',
				links: [
					{ href: '/minska-matsvinn', label: 'Minska matsvinn' },
					{ href: '/skafferi-app', label: 'Skafferi-app' },
					{ href: '/kvitto-pdf-kivra', label: 'Kvitto & Kivra' }
				]
			},
			{
				title: 'Juridik',
				links: [{ href: '/privacy', label: 'Integritet' }]
			}
		],
		socialLinks: [
			{
				href: 'https://www.linkedin.com/company/skaffu',
				label: 'LinkedIn',
				external: true
			},
			{
				href: 'https://www.facebook.com/profile.php?id=100066978903320',
				label: 'Facebook',
				external: true
			}
		]
	},
	reduceWaste: {
		title: 'Minska matsvinn med skafferi du har koll på',
		lead:
			'När du ser vad som finns i kyl, frys och skafferi — och vad som går ut snart — blir det lättare att handla rätt och äta upp innan maten kastas.',
		meta: {
			title: 'Minska matsvinn — skafferi-app med utgångsdatum & Ät det först | Skaffu',
			description:
				'Skaffu hjälper hushållet minska matsvinn: utgångsdatum, varningar innan varor går ut och veckoplan från det som redan finns hemma. Prova gratis.',
			ogTitle: 'Minska matsvinn med Skaffu — utgångsdatum och smart inköp',
			ogDescription:
				'Butiksneutral skafferi-app: se utgångsdatum, prioritera det som går ut och slipp dubbelköp som leder till svinn.'
		},
		points: [
			'Utgångsdatum och påminnelser — du ser vad som behöver användas först.',
			'Ät det först och Veckan fixad — middagsförslag från varor som snart går ut.',
			'Inköpslista kopplad till lager — handla det som saknas, inte det du redan har.',
			'Kvitto-PDF och streckkod — snabb start utan att fylla skafferiet manuellt.'
		],
		relatedHref: '/guider/minska-matsvinn-hemma-app',
		relatedLabel: 'Läs guiden om att minska matsvinn hemma'
	},
	pantryApp: {
		title: 'Skafferi-app för hela hushållet',
		lead:
			'Skaffu är en butiksneutral skafferi-app: kyl, frys och skåp som hela familjen delar — oavsett om ni handlar på ICA, Willys eller Coop.',
		meta: {
			title: 'Skafferi-app — kvitto-PDF, lista & utgångsdatum | Skaffu',
			description:
				'Skafferi-app med streckkod, kvitto från Kivra, utgångsdatum och hushållssync. Webb först, gratis att börja — utan kedjelåsning.',
			ogTitle: 'Skaffu — skafferi-app med delad inköpslista',
			ogDescription:
				'Från kvitto-PDF till inköpslista: ett skafferi som speglar vad som faktiskt finns hemma. Jämför med Bring och Matdags.'
		},
		points: [
			'Streckkod, kvitto-PDF och foto — tre sätt att fylla skafferiet snabbt.',
			'Kyl, frys och skafferi på ett ställe med tydlig överblick per plats.',
			'Butiksneutralt — samma lager oavsett kedja, utan stammisapp.',
			'Hushållssync — familj eller rumskamrater ser samma lista och lager.'
		],
		relatedHref: '/guider',
		relatedLabel: 'Fler guider om skafferi och inköp'
	},
	receiptGuide: {
		title: 'Digitalt kvitto (PDF) till skafferi',
		lead:
			'Ladda upp digitalt kvitto från Kivra, ICA, Willys eller e-post — Skaffu tolkar raderna och du granskar alltid innan de sparas.',
		meta: {
			title: 'Digitalt kvitto (PDF) — ladda upp från Kivra & ICA | Skaffu',
			description:
				'Så sparar du kvitto som PDF från Kivra, ICA-appen eller e-post och laddar upp i Skaffu. Butiksneutral skafferi-app — ingen officiell Kivra-integration.',
			ogTitle: 'Digitalt kvitto som PDF — fyll skafferiet med granskning',
			ogDescription:
				'Steg-för-steg: exportera digitalt kvitto, ladda upp PDF i Skaffu och granska varor innan de hamnar i skafferiet.'
		},
		points: [
			'Fungerar med text-PDF från Kivra, ICA, Willys, Coop och fler.',
			'Gratisplan: begränsat antal kvitto-PDF per månad — Pro ger obegränsat.',
			'Du granskar alltid raderna innan de sparas i skafferiet.',
			'Alternativ: fotografera kvittot om PDF saknar läsbart textlager.'
		],
		steps: [
			{
				step: 1,
				title: 'Hitta ditt digitala kvitto',
				description:
					'Öppna Kivra, butiksapp eller e-post. Välj kvittot från butiken (ICA, Willys, Coop m.fl.).'
			},
			{
				step: 2,
				title: 'Spara som PDF',
				description:
					'Tryck på kvittot och välj Dela eller Spara — välj PDF om appen frågar. Du behöver inte skriva ut eller skanna om.'
			},
			{
				step: 3,
				title: 'Ladda upp i Skaffu',
				description:
					'Öppna Skaffu → Skanna → Kvitto. Välj PDF-filen, granska raderna och spara valda varor till kyl, frys eller skafferi.'
			}
		],
		faq: [
			{
				question: 'Fungerar alla digitala kvitton?',
				answer:
					'De flesta text-PDF:er fungerar — från Kivra, ICA, Willys m.fl. Bild-PDF utan text kan du fotografera i stället — samma granskningsflöde.'
			},
			{
				question: 'Måste jag ha Kivra?',
				answer:
					'Nej. Spara PDF från ICA-appen, Willys, Coop eller butikens e-postkvitto — samma uppladdning i Skaffu. Ingen Kivra-koppling krävs.'
			},
			{
				question: 'Lagras kvittot hos er?',
				answer:
					'Vi extraherar varor för ditt lager — inte hela kvittot som arkiv. Se integritetspolicyn för AI-hantering.'
			}
		],
		relatedHref: '/guider',
		relatedLabel: 'Guider om kvitto-PDF och skafferi'
	},
	guidesHub: {
		kicker: 'Guider',
		title: 'Guider för skafferi, matsvinn och smart inköp',
		lead:
			'Praktiska guider för svenska hushåll — utgångsdatum, kvitto-PDF, butiksneutral inköpslista och mindre matsvinn.',
		empty: 'Nya guider publiceras snart.',
		readMore: 'Läs mer',
		backToList: 'Alla guider',
		ctaTitle: 'Prova Skaffu efter guiden',
		ctaLead: 'Skapa konto gratis och testa med kvitto eller streckkod — webb först.',
		meta: {
			title: 'Guider — skafferi, matsvinn & kvitto-PDF | Skaffu',
			description:
				'Praktiska guider om skafferi-app, minska matsvinn, Kivra-kvitto och inköpslista kopplad till kyl och skafferi. Skaffu — butiksneutralt för hela hushållet.',
			ogTitle: 'Skaffu guider — skafferi, matsvinn och smart inköp',
			ogDescription:
				'Guider för svenska hushåll: utgångsdatum, kvitto-PDF, butiksneutral inköpslista och mindre matsvinn.'
		}
	}
};

const en: MarketingContent = {
	...sv,
	tagline: 'Shared weekly shopping with food awareness — shop together, waste less.',
	meta: {
		title: 'Skaffu — pantry app and shopping list for the whole household',
		description:
			'Skaffu is the pantry app for the whole household: shared shopping list, receipt PDF and expiry tracking. Shop together store-neutral — free to start.',
		ogTitle: 'Skaffu — pantry app with shared shopping list',
		ogDescription:
			'Shared list, expiry dates and weekly suggestions from Skaffu. Shop together in the store — web-first, store-neutral.'
	},
	nav: [
		{ href: '/funktioner', label: 'Product' },
		{ href: '/priser', label: 'Pricing' },
		{ href: '/guider', label: 'Guides' },
		{ href: '/faq', label: 'FAQ' }
	],
	header: {
		navAria: 'Site',
		navMobileAria: 'Site mobile',
		menuToggle: 'Menu'
	},
	cta: {
		openApp: 'Open app',
		login: 'Log in',
		register: 'Create account',
		tryFree: 'Get started free',
		createWeeklyList: "Create this week's list"
	},
	proLaunch: proLaunchLiveEn,
	comparison: {
		title: 'Compared to apps you may already use',
		lead: 'An honest view — we are not here to replace what already works for you. Here is when Skaffu complements or differs.',
		disclaimer:
			'Dedicated list apps and pantry trackers are strong in their niches. We focus on a store-neutral pantry and shopping list in one app — not loyalty programs or gamification.',
		themColumn: 'What they do well',
		usColumn: 'What Skaffu adds',
		rows: [
			{
				competitor: 'List apps (AnyList, OurGroceries)',
				theirStrength:
					'Fast shared shopping lists and household sync — the default for many families who already live in a list app.',
				skaffu:
					'Same shared list — plus pantry inventory, expiry dates and Eat First so you shop based on what is actually at home.'
			},
			{
				competitor: 'Pantry trackers (NoWaste, etc.)',
				theirStrength:
					'Large barcode databases, expiry tracking and native apps built around reducing food waste.',
				skaffu:
					'Receipt PDF with review, meal plan tied to pantry, household sync and store-neutral shopping — web-first without switching apps on day one.'
			},
			{
				competitor: 'Meal planners (Mealime, etc.)',
				theirStrength:
					'Recipe ideas and weekly menus with polished native experiences and curated meal libraries.',
				skaffu:
					'Plans built from your actual pantry and expiry dates — one click to shopping list, without a separate inventory world.'
			}
		],
		ctaTitle: 'Try a store-neutral pantry',
		ctaLead: 'Create your list and invite your partner — get started in a minute.'
	},
	landing: {
		heroDomainSuffix: '· skaffu.com',
		heroEyebrow: 'Pantry app for the whole household',
		heroTitle: 'Skaffu — shop together with pantry awareness.',
		heroLead:
			'Shared shopping list and pantry for the whole household — invite your partner, check off in the store and see what is at home before you shop.',
		heroSecondary:
			'Receipts and checkoffs help Skaffu suggest the weekly list. Store-neutral — ICA, Willys or Coop.',
		heroHighlightsAria: 'Highlights',
		heroHighlights: {
			list: 'Shared list in real time',
			partner: 'Invite your partner',
			eatFirst: 'See what expires soon'
		},
		statsAria: 'Skaffu in numbers',
		seeAllFeatures: 'See all features',
		wasteMeterLabel: 'Less food waste',
		wasteMeterCaption: 'Week sorted — expiring items become dinners and a shopping list in one click.',
		comparisonKicker: 'Compared to list & pantry apps',
		readHowItWorks: 'See how it works',
		stats: [
			{ value: '1', label: 'shared list — avoid duplicate buys when you shop together' },
			{ value: '↓', label: 'less waste — see what expires before it goes bad' },
			{ value: 'kr', label: 'track shopping in statistics — receipts and habits in one place' }
		],
		differentiatorsTitle: 'Built for households that shop together',
		differentiatorsLead:
			'A shared weekly list that learns your habits — from receipts and checkoffs to weekly suggestions, not just an empty list.',
		differentiators: [
			{
				tag: 'Weekly list',
				title: 'Shop from one list',
				description:
					'Shared shopping list in real time — invite your partner, check off in the store and avoid duplicate buys.'
			},
			{
				tag: 'Weekly suggestions',
				title: 'Skaffu suggests',
				description:
					'Receipts and checkoffs feed weekly suggestions for what you usually need — less guesswork before shopping.'
			},
			{
				tag: 'Eat first',
				title: 'Less waste at home',
				description: 'See what expires soon and prioritise it in the meal plan — before food ends up in the bin.'
			},
			{
				tag: 'Store-neutral',
				title: 'Same list everywhere',
				description: 'ICA, Willys, Coop or Lidl — one household, one list. No chain lock-in.'
			}
		],
		featuresTitle: 'Everything you need in the kitchen',
		featuresLead: 'From shared list to food awareness — fast, clear and low friction.',
		wasteReductionTitle: 'Less waste when the list knows what you have',
		wasteReductionLead:
			'When Skaffu knows your habits it is easier to buy the right amount, use items before they expire and reduce food waste at home.',
		wasteReductionPoints: [
			'Expiry dates and warnings before food goes bad.',
			'Weekly suggestions and recipes based on what you actually have at home.',
			'Receipt PDF and checkoffs — so next week\'s list hits the mark.'
		],
		stepsTitle: 'Weekly shopping in three steps',
		stepsLead: 'From shared list to less waste — no complicated setup.',
		stepsKicker: 'How it works',
		finalCtaTitle: 'Ready to create this week\'s list?',
		finalCtaLead: "Create this week's list free — invite your partner and shop together today.",
		guidesTeaserTitle: 'Latest guides',
		guidesTeaserLead:
			'Practical articles on pantry management, food waste and receipt PDF — for everyday households.',
		guidesTeaserSeeAll: 'All guides',
		guidesTeaserReadMore: 'Read guide',
		scanCtaLabel: 'Get started — scan a receipt or build your list',
		dashboardCardsTitle: 'Pantry and weekly shopping at a glance',
		dashboardCardsLead:
			'Three everyday surfaces in the app — tap to learn more about pantry, shopping list and expiring items.',
		dashboardCardsSeeMore: 'See more',
		dashboardCards: [
			{
				title: 'Pantry',
				href: '/skafferi-app',
				previewLines: ['24 items in the household', 'Fridge 12 · Freezer 3 · Cupboard 9']
			},
			{
				title: 'Shopping',
				href: '/funktioner',
				previewLines: ['5 items on the list', 'You usually shop on Saturdays']
			},
			{
				title: 'Expiring soon',
				href: '/minska-matsvinn',
				previewLines: ['Milk — tomorrow', 'Yoghurt — in 2 days', 'Tomatoes — in 3 days']
			}
		],
		heroVisual: {
			listTitle: "This week's list",
			listItemChecked: 'Anna checked off milk',
			listItemPending: 'Tomatoes',
			listItemPending2: 'Pasta',
			suggestionText: 'Skaffu suggests: Yogurt',
			suggestionBadge: 'From your receipts',
			eatFirstBadge: 'Eat first',
			eatFirstCaption: '3 items expiring — eat first',
			shareLink: 'Share link',
			shopTogether: 'Shop together',
			memberAvatars: 'A · E'
		}
	},
	features: {
		title: 'Features',
		lead: 'Built for everyday kitchen use — fast, clear and low friction.',
		meta: {
			title: 'Features — receipt PDF, statistics & smart shopping list | Skaffu',
			description:
				'Barcode, receipt PDF, expiry dates, weekly suggestions and shopping statistics — store-neutral pantry app that complements list apps and pantry trackers.',
			ogTitle: 'Skaffu features — pantry, list and receipt PDF',
			ogDescription:
				'PDF receipts with review, weekly suggestions and shopping list tied to your pantry. Web-first, without gamification.'
		},
		items: [
			{
				icon: 'home',
				title: 'Household together',
				description:
					'Invite family or roommates. Everyone sees the same shopping list in real time — shop together in the store.'
			},
			{
				icon: 'sparkle',
				title: 'Smart shopping list',
				description:
					'Shared weekly list with weekly suggestions — check off together and avoid duplicate buys.'
			},
			{
				icon: 'sparkle',
				title: 'Weekly suggestions',
				description:
					'Skaffu suggests what you usually need next week — from receipts, checkoffs and habits.'
			},
			{
				icon: 'receipt',
				title: 'Receipt PDF',
				description:
					'Upload a digital receipt from Kivra, ICA or Willys. You review lines before they are saved to the pantry.'
			},
			{
				icon: 'users',
				title: 'Statistics',
				description:
					'Track shopping and receipts for the household — see patterns in what you buy and when you shop.'
			},
			{
				icon: 'box',
				title: 'Eat first',
				description:
					'See what expires soon at home and only shop what is missing — less waste, right buys.'
			},
			{
				icon: 'barcode',
				title: 'Barcode scanning',
				description: 'Scan items in seconds. The app fills in name and location so you type less.'
			},
			{
				icon: 'users',
				title: 'Meal plan & recipes',
				description:
					'Plan the week under Meal plan and get recipe ideas under Eat — from what is already at home.'
			}
		]
	},
	howItWorks: {
		title: 'How it works',
		lead: 'From account to weekly suggestions — the same flow as onboarding in the app.',
		meta: {
			title: 'How Skaffu works — pantry app in three steps',
			description:
				'Create an account, invite your partner and build the pantry with receipts or a list. Get started with Skaffu — the pantry app that helps reduce food waste.',
			ogTitle: 'How Skaffu works — from account to weekly suggestions',
			ogDescription:
				'Account → invite → list and receipt → shop together. Three steps to a better pantry.'
		},
		steps: [
			{
				step: 1,
				title: 'Create account and invite',
				description:
					'Create an account, set up your household and invite your partner — everyone sees the same shopping list in real time.'
			},
			{
				step: 2,
				title: 'Build list and pantry',
				description:
					'Add this week\'s items, upload a receipt PDF or scan barcodes. You always review before saving.'
			},
			{
				step: 3,
				title: 'Shop together — Skaffu suggests next week',
				description:
					'Check off in the store while your partner adds items at home. Next week you get suggestions based on habits and expiring items.'
			}
		]
	},
	faq: {
		title: 'Frequently asked questions',
		lead: 'Answers to what we hear most often about Skaffu, pricing and privacy.',
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
					'Skaffu is a pantry app where you see what is at home: expiry dates, warnings before items go bad and weekly suggestions from what you already have. Recipes and shopping lists can build on the same pantry — so less food is thrown away and fewer duplicate buys.'
			},
			{
				question: 'Does Skaffu cost anything?',
				answer:
					'You can create an account and use the app free on a generous core plan (pantry, manual list, two household members). Pro (~39 SEK/month) adds unlimited AI, receipt PDF, statistics and more household members — upgrade in Settings when you want. See /priser for more.'
			},
			{
				question: 'Does it work without a barcode?',
				answer: 'Yes. Add items manually, upload a receipt PDF or take a photo when the barcode is missing.'
			},
			{
				question: 'Can several people in the household share one pantry?',
				answer: 'Yes. Invite members to your household to share pantry, shopping list and meal plan.'
			},
			{
				question: 'What does statistics show in Skaffu?',
				answer:
					'Under Statistics the household sees aggregated shopping and receipt patterns — what you buy often, how much expires and trends over time. Pro gives full access; the free plan has basic insights.'
			},
			{
				question: 'Where is my data stored?',
				answer:
					'Your data is stored securely in the cloud linked to your account and household. See our privacy policy for AI and GDPR details.'
			},
			{
				question: 'How is AI used in the app?',
				answer:
					'AI (OpenAI) helps parse receipt PDFs, suggest items and give shopping and recipe ideas. We only send what is needed for the feature and use the API in a way that does not train OpenAI models. See the privacy policy for details.'
			},
			{
				question: 'Can I share expiring items with neighbours?',
				answer:
					'Yes — Neighbour pantry (beta) lets you create a time-limited link (48 hours) with items expiring soon, with no address or geo. Recipients only see item names and expiry dates. Try it under /grannskafferiet in the app.'
			},
			{
				question: 'Can I add Skaffu to my home screen?',
				answer:
					'Yes. Open the app in Safari (iPhone) or Chrome (Android) and choose Add to Home Screen / Install app. In the app, go to Settings → Add to home screen for step-by-step instructions. On desktop, use the app in your browser.'
			},
			{
				question: 'How do I delete my account?',
				answer:
					'Go to Settings → Account → Delete my account. Household owners can also delete the whole household under Settings → Household. Deletion is permanent — see the privacy policy for data retention details.'
			}
		],
		pricingLinkLabel: 'Pricing & plans',
		contactLabel: 'Cannot find your answer?',
		contactLead: 'Email us and we will get back to you as soon as we can.',
		contactEmail: 'hello@skaffu.com'
	},
	footer: {
		tagline: "Pantry app and shopping list for the whole household.",
		rights: '© Skaffu. All rights reserved.',
		navAria: 'Footer',
		socialLabel: 'Follow us',
		sections: [
			{
				title: 'Product',
				links: [
					{ href: '/funktioner', label: 'Features' },
					{ href: '/sa-fungerar-det', label: 'How it works' }
				]
			},
			{
				title: 'Use cases',
				links: [
					{ href: '/minska-matsvinn', label: 'Reduce food waste' },
					{ href: '/skafferi-app', label: 'Pantry app' },
					{ href: '/kvitto-pdf-kivra', label: 'Receipt PDF' }
				]
			},
			{
				title: 'Legal',
				links: [{ href: '/privacy', label: 'Privacy' }]
			}
		],
		socialLinks: [
			{
				href: 'https://www.linkedin.com/company/skaffu',
				label: 'LinkedIn',
				external: true
			},
			{
				href: 'https://www.facebook.com/profile.php?id=100066978903320',
				label: 'Facebook',
				external: true
			}
		]
	},
	reduceWaste: {
		title: 'Reduce food waste with a pantry you can trust',
		lead:
			'When you see what is in the fridge, freezer and cupboard — and what expires soon — it is easier to shop the right amount and eat up before food is thrown away.',
		meta: {
			title: 'Reduce food waste — pantry app with expiry dates | Skaffu',
			description:
				'Skaffu helps households cut food waste: expiry dates, warnings before items go bad and weekly plans from what you already have. Free to start.',
			ogTitle: 'Reduce food waste with Skaffu — expiry-aware pantry',
			ogDescription:
				'Store-neutral pantry app: see expiry dates, prioritise what goes out soon and avoid duplicate buys that lead to waste.'
		},
		points: [
			'Expiry dates and reminders — see what to use first.',
			'Eat-first suggestions and weekly ritual — meals from items expiring soon.',
			'Shopping list tied to inventory — buy what is missing, not what you already have.',
			'Receipt PDF and barcode — quick start without manual pantry admin.'
		],
		relatedHref: '/guider/minska-matsvinn-hemma-app',
		relatedLabel: 'Read the guide on reducing food waste at home'
	},
	pantryApp: {
		title: 'Pantry app for the whole household',
		lead:
			'Skaffu is a store-neutral pantry app: fridge, freezer and cupboards that the whole family shares — whether you shop at ICA, Willys or Coop.',
		meta: {
			title: 'Pantry app — receipt PDF, list & expiry dates | Skaffu',
			description:
				'Pantry app with barcode scan, Kivra receipt PDF, expiry dates and household sync. Web-first, free to start — no chain lock-in.',
			ogTitle: 'Skaffu — pantry app with shared shopping list',
			ogDescription:
				'From receipt PDF to shopping list: a pantry that reflects what is actually at home. Compare with list-only apps.'
		},
		points: [
			'Barcode, receipt PDF and photo — three ways to fill the pantry fast.',
			'Fridge, freezer and cupboard in one place with clear location overview.',
			'Store-neutral — same inventory regardless of chain, no loyalty app required.',
			'Household sync — family or roommates share the same list and stock.'
		],
		relatedHref: '/guider',
		relatedLabel: 'More guides on pantry and shopping'
	},
	receiptGuide: {
		title: 'Digital receipt (PDF) to pantry',
		lead:
			'Upload a digital receipt from Kivra, ICA, Willys or email — Skaffu parses the lines and you always review before they are saved.',
		meta: {
			title: 'Digital receipt (PDF) — upload from Kivra & ICA | Skaffu',
			description:
				'How to save receipts as PDF from Kivra, the ICA app or email and upload in Skaffu. Store-neutral pantry app — not an official Kivra integration.',
			ogTitle: 'Digital receipt as PDF — fill the pantry with review',
			ogDescription:
				'Step by step: export a digital receipt, upload the PDF in Skaffu and review lines before they enter the pantry.'
		},
		points: [
			'Works with text PDFs from Kivra, ICA, Willys, Coop and more.',
			'Free plan: limited receipt PDFs per month — Pro is unlimited.',
			'You always review lines before they are saved to the pantry.',
			'Alternative: photograph the receipt if the PDF has no readable text layer.'
		],
		steps: [
			{
				step: 1,
				title: 'Find your digital receipt',
				description:
					'Open Kivra, a store app or email. Pick the receipt from the store (ICA, Willys, Coop, etc.).'
			},
			{
				step: 2,
				title: 'Save as PDF',
				description:
					'Tap the receipt and choose Share or Save — pick PDF if prompted. No need to print or rescan.'
			},
			{
				step: 3,
				title: 'Upload in Skaffu',
				description:
					'Open Skaffu → Scan → Receipt. Choose the PDF, review lines and save selected items to fridge, freezer or cupboard.'
			}
		],
		faq: [
			{
				question: 'Do all digital receipts work?',
				answer:
					'Most text PDFs work — from Kivra, ICA, Willys and more. Image-only PDFs can be photographed instead — same review flow.'
			},
			{
				question: 'Do I need Kivra?',
				answer:
					'No. Save a PDF from the ICA app, Willys, Coop or store email — same upload in Skaffu. No Kivra connection required.'
			},
			{
				question: 'Do you store the full receipt?',
				answer:
					'We extract items for your inventory — not the full receipt as an archive. See the privacy policy for AI handling.'
			}
		],
		relatedHref: '/guider',
		relatedLabel: 'Guides on receipt PDF and pantry'
	},
	guidesHub: {
		kicker: 'Guides',
		title: 'Guides for pantry, food waste and smart shopping',
		lead:
			'Practical guides for households — expiry dates, receipt PDF, store-neutral shopping lists and less food waste.',
		empty: 'New guides coming soon.',
		readMore: 'Read more',
		backToList: 'All guides',
		ctaTitle: 'Try Skaffu after the guide',
		ctaLead: 'Create a free account and test with a receipt or barcode — web-first.',
		meta: {
			title: 'Guides — pantry, food waste & receipt PDF | Skaffu',
			description:
				'Practical guides on pantry apps, reducing food waste, Kivra receipts and shopping lists tied to fridge and cupboard. Skaffu — store-neutral for the whole household.',
			ogTitle: 'Skaffu guides — pantry, food waste and smart shopping',
			ogDescription:
				'Guides for households: expiry dates, receipt PDF, store-neutral shopping and less food waste.'
		}
	}
};

const contentByLocale: Record<MarketingLocale, MarketingContent> = { sv, en };

const proLaunchByLocale: Record<
	MarketingLocale,
	{ live: MarketingProLaunch; comingSoon: MarketingProLaunch }
> = {
	sv: { live: proLaunchLiveSv, comingSoon: proLaunchComingSoonSv },
	en: { live: proLaunchLiveEn, comingSoon: proLaunchComingSoonEn }
};

const faqCostAnswerByLocale: Record<
	MarketingLocale,
	{ live: string; comingSoon: string }
> = {
	sv: { live: faqCostAnswerLiveSv, comingSoon: faqCostAnswerComingSoonSv },
	en: { live: faqCostAnswerLiveEn, comingSoon: faqCostAnswerComingSoonEn }
};

function applyStripeCheckoutMarketingMode(
	content: MarketingContent,
	locale: MarketingLocale,
	stripeCheckoutEnabled: boolean
): MarketingContent {
	const proLaunch = stripeCheckoutEnabled
		? proLaunchByLocale[locale].live
		: proLaunchByLocale[locale].comingSoon;
	const faqCostAnswer = stripeCheckoutEnabled
		? faqCostAnswerByLocale[locale].live
		: faqCostAnswerByLocale[locale].comingSoon;

	return {
		...content,
		proLaunch,
		faq: {
			...content.faq,
			items: content.faq.items.map((item) =>
				FAQ_COST_QUESTIONS.has(item.question) ? { ...item, answer: faqCostAnswer } : item
			)
		}
	};
}

export function getMarketingContent(
	locale: MarketingLocale = 'sv',
	stripeCheckoutEnabled = false
): MarketingContent {
	const content = contentByLocale[locale] ?? contentByLocale.sv;
	return applyStripeCheckoutMarketingMode(content, locale, stripeCheckoutEnabled);
}
