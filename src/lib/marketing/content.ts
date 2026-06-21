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

const sv: MarketingContent = {
	siteName: 'Skaffu',
	tagline: 'Gemensam veckohandel med matkoll — handla ihop, släng mindre.',
	meta: {
		title: 'Skaffu — skafferi-app & inköpslista för hela hushållet | handla ihop',
		description:
			'Skafferi-app och delad inköpslista för hela hushållet. Handla ihop med koll på kyl, frys och skafferi — butiksneutralt, gratis att börja på skaffu.com.',
		ogTitle: 'Skaffu — skafferi-app med gemensam inköpslista',
		ogDescription:
			'Handla ihop med koll på skafferiet. Delad lista, utgångsdatum och smarta förslag — webb först, butiksneutralt.'
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
	proLaunch: {
		badge: 'Pro är live',
		title: 'Mer plats när hela hushållet är med',
		lead:
			'Pro ger plats för fler i hushållet och smartare listförslag från hushållets minne. Gratisplanen finns kvar om du vill prova i lugn och ro.',
		bullets: [
			'Smarta listförslag från hushållets minne',
			'Full statistik och insikter för hushållet',
			'Upp till 6 hushållsmedlemmar',
			'Från cirka 39 kr/mån — uppgradera när du är redo'
		],
		priceFrom: 'från 39 kr/mån',
		ctaPricing: 'Se Pro & priser',
		ctaFree: 'Kom igång gratis'
	},
	landing: {
		heroDomainSuffix: '· skaffu.com',
		heroEyebrow: 'Skafferi-app · handla ihop · skaffu.com',
		heroTitle: 'Handla ihop med koll på skafferiet.',
		heroLead:
			'Delad inköpslista och skafferi för hela hushållet — bjud in partner, checka av i butiken och se vad som finns hemma innan ni handlar.',
		heroSecondary:
			'Kvitton och checkoffs bygger hushållets minne. Butiksneutralt — ICA, Willys eller Coop.',
		heroHighlightsAria: 'Det viktigaste',
		heroHighlights: {
			list: 'Delad lista i realtid',
			partner: 'Bjud in partner',
			eatFirst: 'Lär sig vad ni brukar köpa'
		},
		statsAria: 'Skaffu i siffror',
		seeAllFeatures: 'Se alla funktioner',
		wasteMeterLabel: 'Mindre matsvinn',
		wasteMeterCaption: 'Veckan fixad — utgående varor blir middag och inköpslista på ett klick.',
		comparisonKicker: 'Jämfört med Bring & ICA',
		readHowItWorks: 'Se hur det fungerar',
		stats: [
			{ value: '1', label: 'gemensam lista — synkad i realtid för hela hushållet' },
			{ value: '2+', label: 'i hushållet — bjud in partner och handla ihop' },
			{ value: '↓', label: 'mindre dubbelköp och matsvinn med Ät det först' }
		],
		differentiatorsTitle: 'Byggt för hushåll som handlar ihop',
		differentiatorsLead:
			'En delad veckolista som lär sig era vanor — från kvitton och checkoffs till smarta förslag, inte bara en tom lista.',
		differentiators: [
			{
				tag: 'Veckolista',
				title: 'Lista tillsammans',
				description:
					'Delad inköpslista i realtid — bjud in partner, checka av i butiken och håll koll på veckans handel.'
			},
			{
				tag: 'Hushållsminne',
				title: 'Lär sig vad ni brukar köpa',
				description:
					'Kvitton och checkoffs bygger hushållets minne — Skaffu föreslår vad ni brukar behöva nästa vecka.'
			},
			{
				tag: 'Ät det först',
				title: 'Mindre svinn hemma',
				description:
					'Varningar och prioritering så ni använder det som går ut snart — innan det hamnar i soporna.'
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
			'När hushållets minne känner era vanor blir det lättare att handla rätt mängd, använda det som går ut snart och slippa dubbelköp.',
		wasteReductionPoints: [
			'Utgångsdatum och varningar innan varor hinner bli dåliga.',
			'Recept och inköpslista utifrån det som faktiskt finns hemma.',
			'Checkoffs och kvitton bygger minnet — så nästa veckas lista träffar rätt.'
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
			title: 'Funktioner — skanning, kvitto-PDF & smart inköpslista',
			description:
				'Streckkod, kvitto-PDF, utgångsdatum, måltidsplan och hushållssync — butiksneutralt skafferi som kompletterar Bring och Matdags.',
			ogTitle: 'Skaffu funktioner — lager som sanningskälla',
			ogDescription:
				'PDF-kvitto, AI-skannar och inköpslista kopplad till lager. Webb först, utan spelifiering.'
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
					'Gemensam veckolista med förslag från hushållets minne — checka av tillsammans och slipp dubbelköp.'
			},
			{
				icon: 'sparkle',
				title: 'Skaffu föreslår',
				description:
					'Hushållets minne från kvitton och mönster — förslag på vad ni brukar behöva nästa vecka.'
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
				icon: 'receipt',
				title: 'Kvitto & foto',
				description:
					'Fotografera kvitto eller hyllan — AI hjälper till att tolka och lägga till flera varor på en gång.'
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
			'Bring!, ICA och Matdags är starka produkter i sina nischer. Vi fokuserar på gemensam veckolista och hushållets minne — butiksneutralt — inte på stammisrabatter eller gamification.',
		themColumn: 'Det de gör bra',
		usColumn: 'Det Skaffu lägger till',
		rows: [
			{
				competitor: 'Bring!',
				theirStrength:
					'Marknadsledande delad inköpslista och sync mellan familjemedlemmar — enkelt och välkänt i Norden.',
				homePantry:
					'Samma delade lista — plus skafferi, utgångsdatum och Ät det först så listan speglar vad som faktiskt finns hemma, inte bara vad ni tänkt köpa.'
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
		ctaLead: 'Skapa lista och bjud in partner — kom igång på en minut.'
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
				title: 'Skapa gemensam lista',
				description:
					'Lägg till veckans varor och bjud in partner — alla ser samma inköpslista i realtid.'
			},
			{
				step: 2,
				title: 'Handla ihop',
				description:
					'Checka av i butiken medan partnern lägger till saker hemma. Dela länk om någon handlar själv.'
			},
			{
				step: 3,
				title: 'Nästa vecka — Skaffu föreslår',
				description:
					'Hushållets minne från kvitton och checkoffs ger förslag på veckans lista — ät det som går ut och handla bara det som saknas.'
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
					'Du kan skapa konto och använda appen gratis med en generös kärnplan (lager, manuell lista, två hushållsmedlemmar). Pro (~39 kr/mån) ger obegränsad AI, kvitto-PDF och fler hushållsmedlemmar — uppgradera under Inställningar när du vill. Läs mer på /priser.'
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
				question: 'Kan jag dela utgående varor med grannar?',
				answer:
					'Ja, som beta kan du skapa en tidsbegränsad länk (48 timmar) med varor som går ut snart — utan adress eller geo. Mottagaren ser bara varunamn och utgångsdatum. Läs mer i docs/GRANNSKAFFERIET_V0.md.'
			},
			{
				question: 'Kan jag lägga till Skaffu på hemskärmen?',
				answer:
					'Ja. Öppna appen i Safari (iPhone) eller Chrome (Android) och välj Lägg till på hemskärmen / Installera app. I appen under Inställningar → Lägg till på hemskärmen finns steg-för-steg-guide. På dator fungerar appen i webbläsaren.'
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
			title: 'Minska matsvinn — skafferi-app med utgångsdatum & Ät det först',
			description:
				'Skaffu hjälper hushållet minska matsvinn: lager som sanningskälla, varningar innan varor går ut och veckoplan från det som redan finns hemma. Prova gratis.',
			ogTitle: 'Minska matsvinn med Skaffu — lager, utgång & smart inköp',
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
			'Skaffu är en butiksneutral skafferi-app: ett lager för kyl, frys och skåp som hela familjen delar — oavsett om ni handlar på ICA, Willys eller Coop.',
		meta: {
			title: 'Skafferi-app — lager, kvitto-PDF & inköpslista | Skaffu',
			description:
				'Skafferi-app med streckkod, kvitto från Kivra, utgångsdatum och hushållssync. Webb först, gratis att börja — utan kedjelåsning.',
			ogTitle: 'Skaffu — skafferi-app med lager som sanningskälla',
			ogDescription:
				'Från skanning till inköpslista: ett skafferi som speglar vad som faktiskt finns hemma. Jämför med Bring och Matdags.'
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
			'Ladda upp digitalt kvitto från Kivra, ICA, Willys eller e-post — AI hjälper till att fylla skafferiet. Du granskar alltid raderna innan de sparas.',
		meta: {
			title: 'Digitalt kvitto (PDF) — guide till kvitto-autopilot i Skaffu',
			description:
				'Så sparar du kvitto som PDF från Kivra, ICA-appen eller e-post och laddar upp i Skaffu. Butiksneutral skafferi-app — ingen officiell Kivra-integration.',
			ogTitle: 'Digitalt kvitto som PDF — fyll skafferiet med review',
			ogDescription:
				'Steg-för-steg: exportera digitalt kvitto, ladda upp PDF i Skaffu och granska varor innan de hamnar i lagret.'
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
			'Long-tail guider för svenska hushåll — lager som sanningskälla, utgångsdatum, kvitto-PDF och butiksneutral inköpslista.',
		empty: 'Nya guider publiceras snart.',
		readMore: 'Läs mer',
		backToList: 'Alla guider',
		ctaTitle: 'Prova Skaffu efter guiden',
		ctaLead: 'Skapa konto gratis och testa med kvitto eller streckkod — webb först.',
		meta: {
			title: 'Guider — skafferi, matsvinn & kvitto-PDF',
			description:
				'Praktiska guider om skafferi-app, minska matsvinn, Kivra-kvitto och inköpslista kopplad till kyl och skafferi. Skaffu — butiksneutralt för hela hushållet.',
			ogTitle: 'Skaffu guider — skafferi, matsvinn och smart inköp',
			ogDescription:
				'SEO-guider för svenska hushåll: utgångsdatum, kvitto-PDF, butiksneutral inköpslista och mindre matsvinn.'
		}
	}
};

const en: MarketingContent = {
	...sv,
	tagline: 'Shared weekly shopping with food awareness — shop together, waste less.',
	meta: {
		title: 'Skaffu — pantry app & shopping list for the whole household | shop together',
		description:
			'Pantry app and shared shopping list for the whole household. Shop together with fridge, freezer and cupboard in sync — store-neutral, free to start at skaffu.com.',
		ogTitle: 'Skaffu — pantry app with shared shopping list',
		ogDescription:
			'Shop together with pantry awareness. Shared list, expiry dates and smart suggestions — web-first, store-neutral.'
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
	proLaunch: {
		badge: 'Pro is live',
		title: 'More room when the whole household joins',
		lead:
			'Pro adds room for more household members, unlimited receipt PDFs and smarter list fill. The free plan is still there if you want to try at your own pace.',
		bullets: [
			'Smart list suggestions from household memory',
			'Full statistics and insights for the household',
			'Up to 6 household members',
			'From about 39 SEK/month — upgrade when you are ready'
		],
		priceFrom: 'from 39 SEK/month',
		ctaPricing: 'See Pro & pricing',
		ctaFree: 'Get started free'
	},
	comparison: {
		title: 'Compared to apps you may already use',
		lead: 'An honest view — we are not here to replace what already works for you. Here is when Skaffu complements or differs.',
		disclaimer:
			'Dedicated list apps and pantry trackers are strong in their niches. We focus on a store-neutral pantry with inventory as source of truth — not loyalty programs or gamification.',
		themColumn: 'What they do well',
		usColumn: 'What Skaffu adds',
		rows: [
			{
				competitor: 'List apps (AnyList, OurGroceries)',
				theirStrength:
					'Fast shared shopping lists and household sync — the default for many families who already live in a list app.',
				homePantry:
					'Same shared list — plus pantry inventory, expiry dates and Eat First so the list reflects what is actually at home, not just planned buys.'
			},
			{
				competitor: 'Pantry trackers (NoWaste, etc.)',
				theirStrength:
					'Large barcode databases, expiry tracking and native apps built around reducing food waste.',
				homePantry:
					'Receipt PDF, meal plan tied to inventory, household sync and store-neutral shopping — web-first without switching apps on day one.'
			},
			{
				competitor: 'Meal planners (Mealime, etc.)',
				theirStrength:
					'Recipe ideas and weekly menus with polished native experiences and curated meal libraries.',
				homePantry:
					'Plans built from your actual pantry and expiry dates — one click to shopping list, without a separate inventory world.'
			}
		],
		ctaTitle: 'Try a store-neutral pantry',
		ctaLead: 'Create your list and invite your partner — get started in a minute.'
	},
	landing: {
		heroDomainSuffix: '· skaffu.com',
		heroEyebrow: 'Pantry app · shop together · skaffu.com',
		heroTitle: 'Shop together with pantry awareness.',
		heroLead:
			'Shared shopping list and pantry for the whole household — invite your partner, check off in the store and see what is at home before you shop.',
		heroSecondary:
			'Receipts and checkoffs build household memory. Store-neutral — ICA, Willys or Coop.',
		heroHighlightsAria: 'Highlights',
		heroHighlights: {
			list: 'Shared list in real time',
			partner: 'Invite your partner',
			eatFirst: 'Learns what you usually buy'
		},
		statsAria: 'Skaffu in numbers',
		seeAllFeatures: 'See all features',
		wasteMeterLabel: 'Less food waste',
		wasteMeterCaption: 'Week sorted — expiring items become dinners and a shopping list in one click.',
		comparisonKicker: 'Compared to list & pantry apps',
		readHowItWorks: 'See how it works',
		stats: [
			{ value: '1', label: 'shared list — synced in real time for the whole household' },
			{ value: '2+', label: 'in the household — invite your partner and shop together' },
			{ value: '↓', label: 'less duplicate buys and food waste with Eat First' }
		],
		differentiatorsTitle: 'Built for households that shop together',
		differentiatorsLead:
			'A shared weekly list that learns your habits — from receipts and checkoffs to smart suggestions, not just an empty list.',
		differentiators: [
			{
				tag: 'Weekly list',
				title: 'Shop from one list',
				description:
					'Shared shopping list in real time — invite your partner, check off in the store and keep track of the week.'
			},
			{
				tag: 'Household memory',
				title: 'Learns what you usually buy',
				description:
					'Receipts and checkoffs build household memory — Skaffu suggests what you usually need next week.'
			},
			{
				tag: 'Eat first',
				title: 'Less waste at home',
				description: 'Warnings and prioritisation so you use items before they go bad.'
			},
			{
				tag: 'Store-neutral',
				title: 'Same list everywhere',
				description: 'ICA, Willys, Coop or Lidl — one household, one list. No chain lock-in.'
			}
		],
		featuresTitle: 'Everything you need in the kitchen',
		featuresLead: 'From scanning to shopping — fast, clear and low friction.',
		wasteReductionTitle: 'Less waste when the list knows what you have',
		wasteReductionLead:
			'When household memory knows your habits it is easier to buy the right amount, use items before they expire and avoid duplicate purchases.',
		wasteReductionPoints: [
			'Expiry dates and warnings before food goes bad.',
			'Recipes and shopping list based on what you actually have at home.',
			'Receipt PDF and scanning — quick start without manually filling the whole pantry.'
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
			title: 'Features — scanning, receipt PDF & smart shopping list',
			description:
				'Barcode, receipt PDF, expiry dates, meal plan and household sync — store-neutral pantry that complements list apps and pantry trackers.',
			ogTitle: 'Skaffu features — inventory as source of truth',
			ogDescription:
				'PDF receipts, AI scans and shopping list tied to inventory. Web-first, without gamification.'
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
					'Shared weekly list with suggestions from household memory — check off together and avoid duplicate buys.'
			},
			{
				icon: 'sparkle',
				title: 'Skaffu suggests',
				description:
					'Household memory from receipts and patterns — suggestions for what you usually need next week.'
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
				icon: 'receipt',
				title: 'Receipt & photo',
				description: 'Photograph a receipt or shelf — AI helps parse and add multiple items at once.'
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
				title: 'Create a shared list',
				description:
					'Add this week\'s items and invite your partner — everyone sees the same shopping list in real time.'
			},
			{
				step: 2,
				title: 'Shop together',
				description:
					'Check off in the store while your partner adds items at home. Share a link if someone shops alone.'
			},
			{
				step: 3,
				title: 'Next week — Skaffu suggests',
				description:
					'Household memory from receipts and checkoffs suggests items for the weekly list — eat what expires and only shop what is missing.'
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
					'You can create an account and use the app free on a generous core plan (inventory, manual list, two household members). Pro (~39 SEK/month) adds unlimited AI, receipt PDF and more household members — upgrade in Settings when you want. See /priser for more.'
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
				question: 'Can I share expiring items with neighbours?',
				answer:
					'Yes — as a beta you can create a time-limited link (48 hours) with items expiring soon, with no address or geo. Recipients only see item names and expiry dates. See docs/GRANNSKAFFERIET_V0.md for details.'
			},
			{
				question: 'Can I add Skaffu to my home screen?',
				answer:
					'Yes. Open the app in Safari (iPhone) or Chrome (Android) and choose Add to Home Screen / Install app. In the app, go to Settings → Add to home screen for step-by-step instructions. On desktop, use the app in your browser.'
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
			title: 'Reduce food waste — pantry app with expiry dates',
			description:
				'Skaffu helps households cut food waste: inventory as source of truth, warnings before items go bad and weekly plans from what you already have. Free to start.',
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
			'Skaffu is a store-neutral pantry app: one inventory for fridge, freezer and cupboards that the whole family shares — whether you shop at ICA, Willys or Coop.',
		meta: {
			title: 'Pantry app — inventory, receipt PDF & shopping list | Skaffu',
			description:
				'Pantry app with barcode scan, Kivra receipt PDF, expiry dates and household sync. Web-first, free to start — no chain lock-in.',
			ogTitle: 'Skaffu — pantry app with inventory as source of truth',
			ogDescription:
				'From scanning to shopping list: a pantry that reflects what is actually at home. Compare with list-only apps.'
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
			'Upload a digital receipt from Kivra, ICA, Willys or email — AI helps fill the pantry. You always review lines before they are saved.',
		meta: {
			title: 'Digital receipt (PDF) — receipt autopilot guide in Skaffu',
			description:
				'How to save receipts as PDF from Kivra, the ICA app or email and upload in Skaffu. Store-neutral pantry app — not an official Kivra integration.',
			ogTitle: 'Digital receipt as PDF — fill the pantry with review',
			ogDescription:
				'Step by step: export a digital receipt, upload the PDF in Skaffu and review lines before they enter inventory.'
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
			'Long-tail guides for households — inventory as source of truth, expiry dates, receipt PDF and store-neutral shopping lists.',
		empty: 'New guides coming soon.',
		readMore: 'Read more',
		backToList: 'All guides',
		ctaTitle: 'Try Skaffu after the guide',
		ctaLead: 'Create a free account and test with a receipt or barcode — web-first.',
		meta: {
			title: 'Guides — pantry, food waste & receipt PDF',
			description:
				'Practical guides on pantry apps, reducing food waste, Kivra receipts and shopping lists tied to fridge and cupboard. Skaffu — store-neutral for the whole household.',
			ogTitle: 'Skaffu guides — pantry, food waste and smart shopping',
			ogDescription:
				'SEO guides for households: expiry dates, receipt PDF, store-neutral shopping and less food waste.'
		}
	}
};

const contentByLocale: Record<MarketingLocale, MarketingContent> = { sv, en };

export function getMarketingContent(locale: MarketingLocale = 'sv'): MarketingContent {
	return contentByLocale[locale];
}
