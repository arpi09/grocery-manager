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
	};
	landing: {
		heroDomainSuffix: string;
		heroTitle: string;
		heroLead: string;
		heroSecondary: string;
		heroHighlightsAria: string;
		heroHighlights: {
			barcode: string;
			receipt: string;
			storage: string;
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
		heroVisual: {
			fridge: string;
			freezer: string;
			cupboard: string;
			eatFirstBadge: string;
			eatFirstCaption: string;
			expiryDays: [string, string, string];
			shoppingList: string;
			shoppingListPill: string;
			scanModes: string;
			storeNeutral: string;
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
	tagline: 'Skafferi, kyl och inköp på ett ställe.',
	meta: {
		title: 'Skaffu — skafferi du har koll på | skanna, ät först, minska svinn',
		description:
			'Skanna skafferiet med streckkod, kvitto eller foto. Ät det först, planera måltider och handla butiksneutralt — lager som sanningskälla för hela hushållet. Prova gratis.',
		ogTitle: 'Skaffu — lager, utgångsdatum och smart inköp',
		ogDescription:
			'Från kvitto-autopilot till Ät det först: ett skafferi som speglar vad som faktiskt finns hemma. Webb först, gratis att börja på skaffu.com.'
	},
	nav: [
		{ href: '/funktioner', label: 'Funktioner' },
		{ href: '/minska-matsvinn', label: 'Matsvinn' },
		{ href: '/sa-fungerar-det', label: 'Så fungerar det' },
		{ href: '/kvitto-pdf-kivra', label: 'Kvitto & Kivra' },
		{ href: '/priser', label: 'Priser' },
		{ href: '/faq', label: 'Vanliga frågor' },
		{ href: '/guider', label: 'Guider' },
		{ href: '/privacy', label: 'Integritet' }
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
		tryFree: 'Kom igång gratis'
	},
	proLaunch: {
		badge: 'Pro är live',
		title: 'Mer kraft när skafferiet växer',
		lead:
			'Pro är här — obegränsad AI, kvitto-PDF och plats för fler i hushållet. Gratisplanen finns kvar om du vill prova i lugn och ro.',
		bullets: [
			'Obegränsad AI-skannning, kvitto-PDF och smart inköpslista',
			'AI-insikter och full statistik för hushållet',
			'Upp till 6 hushållsmedlemmar',
			'Från cirka 39 kr/mån — uppgradera när du är redo'
		],
		priceFrom: 'från 39 kr/mån',
		ctaPricing: 'Se Pro & priser',
		ctaFree: 'Kom igång gratis'
	},
	landing: {
		heroDomainSuffix: '· skaffu.com',
		heroTitle: 'Skaffu — skafferiet du faktiskt har koll på.',
		heroLead:
			'Skanna in det du har hemma på sekunder. Se kyl, frys och skafferi på ett ställe — planera veckan med Veckan fixad och ät det som går ut innan det blir matsvinn.',
		heroSecondary:
			'Lager som sanningskälla, kvitto-autopilot och inköpslista som fylls från det du faktiskt har — butiksneutralt, utan stammiskonto.',
		heroHighlightsAria: 'Snabbstart',
		heroHighlights: {
			barcode: 'Streckkod',
			receipt: 'Kvitto & foto',
			storage: 'Kyl · frys · skafferi'
		},
		statsAria: 'Skaffu i siffror',
		seeAllFeatures: 'Se alla funktioner',
		wasteMeterLabel: 'Mindre matsvinn',
		wasteMeterCaption: 'Veckan fixad — utgående varor blir middag och inköpslista på ett klick.',
		comparisonKicker: 'Jämfört med Bring & ICA',
		readHowItWorks: 'Läs mer om hur det fungerar',
		stats: [
			{ value: '1', label: 'klick — Veckan fixad från utgående varor till matplan' },
			{ value: '3', label: 'sätt att komma igång — streckkod, kvitto, foto' },
			{ value: '0', label: 'krav på matkedja eller stammisapp' }
		],
		differentiatorsTitle: 'Byggt för att du ska äta upp — inte köpa dubbelt',
		differentiatorsLead:
			'Skaffu fyller luckan mellan inköpslistor och det som faktiskt står i skåpen. Här är det som skiljer oss från Bring och ICA.',
		differentiators: [
			{
				tag: 'Sanningskälla',
				title: 'Lager som stämmer',
				description:
					'Inköpslistan speglar kyl, frys och skafferi — inte bara vad ni tänkt handla. Mindre dubbelköp, mer koll.'
			},
			{
				tag: 'Ät det först',
				title: 'Utgång innan det blir svinn',
				description:
					'Varningar och prioritering så du använder det som går ut snart — innan det hamnar i soporna.'
			},
			{
				tag: 'Kvitto-autopilot',
				title: 'PDF och foto från Kivra',
				description:
					'Ladda upp kvitto eller fotografera hyllan — AI hjälper till att fylla skafferiet utan manuell admin.'
			},
			{
				tag: 'Butiksneutral',
				title: 'Samma skafferi överallt',
				description:
					'ICA, Willys, Coop eller Lidl — ett hushåll, ett lager. Ingen kedja låser in din data.'
			}
		],
		featuresTitle: 'Allt du behöver i köket',
		featuresLead: 'Från skanning till inköp — snabbt, tydligt och utan onödig friktion.',
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
		stepsKicker: 'Så fungerar det',
		finalCtaTitle: 'Redo att slippa gissa i skafferiet?',
		finalCtaLead: 'Prova gratis på en minut — eller logga in om du redan har konto.',
		guidesTeaserTitle: 'Senaste guider',
		guidesTeaserLead:
			'Praktiska artiklar om skafferi, matsvinn och kvitto-PDF — skrivna för svenska hushåll.',
		guidesTeaserSeeAll: 'Alla guider',
		guidesTeaserReadMore: 'Läs guiden',
		heroVisual: {
			fridge: 'Kyl',
			freezer: 'Frys',
			cupboard: 'Skafferi',
			eatFirstBadge: 'Ät det först',
			eatFirstCaption: '3 varor går ut denna vecka',
			expiryDays: ['2 dagar', '12 dagar', '5 dagar'],
			shoppingList: 'Inköpslista',
			shoppingListPill: '+2 från lager',
			scanModes: 'Kvitto · streckkod · foto',
			storeNeutral: 'Butiksneutral'
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
		tagline: 'Skafferi, kyl och inköp på ett ställe.',
		rights: '© Skaffu. Alla rättigheter förbehållna.',
		navAria: 'Sidfot'
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
		title: 'Kvitto-PDF från Kivra och butiksappar',
		lead:
			'Digitala kvitton i PDF är Skaffus nordiska wedge — ladda upp från Kivra, ICA eller Willys så hjälper AI till att fylla skafferiet utan manuell inmatning.',
		meta: {
			title: 'Kvitto-PDF & Kivra — guide till digitalt kvitto i Skaffu',
			description:
				'Så sparar du kvitto som PDF från Kivra, ICA-appen eller e-post och laddar upp i Skaffu. Butiksneutral skafferi-app med kvitto-autopilot.',
			ogTitle: 'Kivra-kvitto som PDF — fyll skafferiet automatiskt',
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
				title: 'Hitta kvittot i Kivra',
				description:
					'Öppna Kivra → Inköp eller Dokument. Välj kvittot från butiken (ICA, Willys, Coop m.fl.).'
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
				question: 'Fungerar alla Kivra-kvitton?',
				answer:
					'De flesta digitala kvitton med textlager fungerar. Bild-PDF utan text kan du fotografera i stället — samma granskningsflöde.'
			},
			{
				question: 'Måste jag ha Kivra?',
				answer:
					'Nej. Spara PDF från ICA-appen, Willys, Coop eller butikens e-postkvitto — samma uppladdning i Skaffu.'
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
		{ href: '/minska-matsvinn', label: 'Food waste' },
		{ href: '/sa-fungerar-det', label: 'How it works' },
		{ href: '/kvitto-pdf-kivra', label: 'Receipt PDF' },
		{ href: '/priser', label: 'Pricing' },
		{ href: '/faq', label: 'FAQ' },
		{ href: '/guider', label: 'Guides' },
		{ href: '/privacy', label: 'Privacy' }
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
		tryFree: 'Get started free'
	},
	proLaunch: {
		badge: 'Pro is live',
		title: 'More power as your pantry grows',
		lead:
			'Pro is here — unlimited AI, receipt PDF parsing and room for more household members. The free plan is still there if you want to try at your own pace.',
		bullets: [
			'Unlimited AI scans, receipt PDF and smart shopping list',
			'AI insights and full household statistics',
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
					'Pantry inventory by location, expiry dates and scanning so the list reflects what is actually at home — copy unchecked items back to your list app in one click.'
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
		ctaLead: 'Open the app or log in — start with one receipt or a few barcodes.'
	},
	landing: {
		heroDomainSuffix: '· skaffu.com',
		heroTitle: 'Skaffu — the pantry you actually keep track of.',
		heroLead:
			'Scan what you have at home in seconds. See fridge, freezer and cupboard in one place — plan the week with Week sorted and eat what expires before it becomes waste.',
		heroSecondary:
			'Inventory as source of truth, receipt autopilot and a shopping list filled from what you actually have — store-neutral, no loyalty lock-in.',
		heroHighlightsAria: 'Quick start',
		heroHighlights: {
			barcode: 'Barcode',
			receipt: 'Receipt & photo',
			storage: 'Fridge · freezer · cupboard'
		},
		statsAria: 'Skaffu in numbers',
		seeAllFeatures: 'See all features',
		wasteMeterLabel: 'Less food waste',
		wasteMeterCaption: 'Week sorted — expiring items become dinners and a shopping list in one click.',
		comparisonKicker: 'Compared to list & pantry apps',
		readHowItWorks: 'Read more about how it works',
		stats: [
			{ value: '1', label: 'click — Week sorted from expiring items to meal plan' },
			{ value: '3', label: 'ways to get started — barcode, receipt, photo' },
			{ value: '0', label: 'retailer or loyalty app required' }
		],
		differentiatorsTitle: 'Built so you eat up — not buy twice',
		differentiatorsLead:
			'Skaffu bridges shopping lists and what is actually in your cupboards. Here is what sets us apart from dedicated list apps.',
		differentiators: [
			{
				tag: 'Source of truth',
				title: 'Inventory that matches',
				description:
					'Your shopping list reflects fridge, freezer and cupboard — not just planned buys. Less duplicate shopping.'
			},
			{
				tag: 'Eat first',
				title: 'Expiry before waste',
				description: 'Warnings and prioritisation so you use items before they go bad.'
			},
			{
				tag: 'Receipt autopilot',
				title: 'PDF and photo from Kivra',
				description: 'Upload receipts or photograph shelves — AI helps fill the pantry without manual admin.'
			},
			{
				tag: 'Store-neutral',
				title: 'Same pantry everywhere',
				description: 'ICA, Willys, Coop or Lidl — one household, one inventory. No chain lock-in.'
			}
		],
		featuresTitle: 'Everything you need in the kitchen',
		featuresLead: 'From scanning to shopping — fast, clear and low friction.',
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
		stepsKicker: 'How it works',
		finalCtaTitle: 'Ready to stop guessing what is in the pantry?',
		finalCtaLead: 'Try free in a minute — or log in if you already have an account.',
		guidesTeaserTitle: 'Latest guides',
		guidesTeaserLead:
			'Practical articles on pantry management, food waste and receipt PDF — for everyday households.',
		guidesTeaserSeeAll: 'All guides',
		guidesTeaserReadMore: 'Read guide',
		heroVisual: {
			fridge: 'Fridge',
			freezer: 'Freezer',
			cupboard: 'Cupboard',
			eatFirstBadge: 'Eat first',
			eatFirstCaption: '3 items expire this week',
			expiryDays: ['2 days', '12 days', '5 days'],
			shoppingList: 'Shopping list',
			shoppingListPill: '+2 from inventory',
			scanModes: 'Receipt · barcode · photo',
			storeNeutral: 'Store-neutral'
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
		tagline: 'Pantry, fridge and shopping in one place.',
		rights: '© Skaffu. All rights reserved.',
		navAria: 'Footer'
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
		title: 'Receipt PDF from Kivra and store apps',
		lead:
			'Digital receipts as PDF are Skaffu’s Nordic wedge — upload from Kivra, ICA or Willys and let AI help fill the pantry without manual entry.',
		meta: {
			title: 'Receipt PDF & Kivra — guide to digital receipts in Skaffu',
			description:
				'How to save receipts as PDF from Kivra, the ICA app or email and upload in Skaffu. Store-neutral pantry app with receipt autopilot.',
			ogTitle: 'Kivra receipt as PDF — fill the pantry automatically',
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
				title: 'Find the receipt in Kivra',
				description:
					'Open Kivra → Purchases or Documents. Pick the receipt from the store (ICA, Willys, Coop, etc.).'
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
				question: 'Do all Kivra receipts work?',
				answer:
					'Most digital receipts with a text layer work. Image-only PDFs can be photographed instead — same review flow.'
			},
			{
				question: 'Do I need Kivra?',
				answer:
					'No. Save PDF from the ICA app, Willys, Coop or store email receipts — same upload in Skaffu.'
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
