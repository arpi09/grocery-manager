import type { SitemapEntry } from '$lib/seo/seo';
import { MARKETING_CONTENT_LASTMOD } from '$lib/seo/seo';

/**
 * Programmatic long-tail SEO: one page per grocery chain, targeting real transactional
 * intent ("ICA kvitto app", "Coop kvitto pdf"). Each entry carries genuinely differentiated,
 * truthful content — NOT a city-name-swapped template. Skaffu is butiksneutralt and imports
 * receipt PDFs/images, so "import your [store] receipt" is honest for every chain.
 */
export interface StoreGuideStep {
	step: number;
	title: string;
	description: string;
}

export interface StoreGuideFaqItem {
	question: string;
	answer: string;
}

export interface StoreGuide {
	slug: string;
	storeName: string;
	meta: {
		title: string;
		description: string;
		ogTitle: string;
		ogDescription: string;
	};
	h1: string;
	lead: string;
	points: string[];
	steps: StoreGuideStep[];
	faq: StoreGuideFaqItem[];
}

function commonSteps(store: string): StoreGuideStep[] {
	return [
		{
			step: 1,
			title: 'Hämta ditt digitala kvitto',
			description: `Öppna kvittot från ${store} — via Kivra, butikens app eller mejl — och spara det som PDF eller bild.`
		},
		{
			step: 2,
			title: 'Ladda upp i Skaffu',
			description:
				'Välj Skanna → Kvitto och ladda upp filen. Skaffu läser av varorna åt dig — inget behöver skrivas för hand.'
		},
		{
			step: 3,
			title: 'Granska och spara',
			description:
				'Du ser varje rad innan den sparas. Justera mängd eller plats om något blev fel, och lägg allt i skafferiet med ett klick.'
		}
	];
}

export const STORE_GUIDES: StoreGuide[] = [
	{
		slug: 'ica',
		storeName: 'ICA',
		meta: {
			title: 'Kvitto från ICA i appen — importera till skafferiet',
			description:
				'Ladda upp ditt ICA-kvitto (PDF eller bild från Kivra eller ICA-appen) i Skaffu. Varorna hamnar i skafferiet — butiksneutralt och gratis att börja.',
			ogTitle: 'ICA-kvitto i Skaffu — från kvitto till skafferi',
			ogDescription:
				'Importera ICA-kvitton till din delade inköpslista och skafferi. Du granskar raderna innan de sparas.'
		},
		h1: 'ICA-kvitto rakt in i skafferiet',
		lead: 'Handlar ni på ICA? Ladda upp det digitala kvittot i Skaffu så fyller vi skafferiet åt er — och nästa veckas lista lär sig vad ni brukar köpa.',
		points: [
			'Digitalt ICA-kvitto finns via Kivra och ICA-appen för medlemmar — spara som PDF eller bild.',
			'Skaffu läser av raderna och föreslår plats och hållbarhet; du granskar innan något sparas.',
			'Butiksneutralt — samma skafferi och lista fungerar oavsett om nästa handling blir på Willys eller Coop.'
		],
		steps: commonSteps('ICA'),
		faq: [
			{
				question: 'Får jag digitalt kvitto från ICA?',
				answer:
					'Som ICA-medlem kan du få digitala kvitton via Kivra och se köp i ICA-appen. Spara kvittot som PDF eller ta en bild och ladda upp det i Skaffu.'
			},
			{
				question: 'Sparar Skaffu mina kvitton hos ICA?',
				answer:
					'Nej. Skaffu är butiksneutralt och kopplar inte ihop sig med ICA. Kvittot du laddar upp stannar i ditt eget hushåll i Skaffu.'
			},
			{
				question: 'Vad kostar det?',
				answer: 'Det är gratis att börja. Du kan skapa konto och importera kvitton på gratisplanen.'
			}
		]
	},
	{
		slug: 'coop',
		storeName: 'Coop',
		meta: {
			title: 'Kvitto från Coop i appen — importera till skafferiet',
			description:
				'Ladda upp ditt Coop-kvitto (PDF eller bild från Kivra eller Coop-appen) i Skaffu. Varorna hamnar i skafferiet — butiksneutralt och gratis att börja.',
			ogTitle: 'Coop-kvitto i Skaffu — från kvitto till skafferi',
			ogDescription:
				'Importera Coop-kvitton till din delade inköpslista och skafferi. Du granskar raderna innan de sparas.'
		},
		h1: 'Coop-kvitto rakt in i skafferiet',
		lead: 'Handlar ni på Coop? Ladda upp det digitala kvittot i Skaffu så fyller vi skafferiet åt er — och veckans lista lär sig era vanor.',
		points: [
			'Digitalt Coop-kvitto finns via Kivra och Coop-appen för medlemmar — spara som PDF eller bild.',
			'Skaffu läser av raderna och föreslår plats och hållbarhet; du granskar innan något sparas.',
			'Butiksneutralt — ett hushåll, en lista, oavsett vilken kedja ni handlar på nästa gång.'
		],
		steps: commonSteps('Coop'),
		faq: [
			{
				question: 'Får jag digitalt kvitto från Coop?',
				answer:
					'Som Coop-medlem kan du få digitala kvitton via Kivra och se köp i Coop-appen. Spara kvittot som PDF eller ta en bild och ladda upp det i Skaffu.'
			},
			{
				question: 'Sparar Skaffu mina kvitton hos Coop?',
				answer:
					'Nej. Skaffu är butiksneutralt och kopplar inte ihop sig med Coop. Kvittot du laddar upp stannar i ditt eget hushåll i Skaffu.'
			},
			{
				question: 'Vad kostar det?',
				answer: 'Det är gratis att börja. Du kan skapa konto och importera kvitton på gratisplanen.'
			}
		]
	},
	{
		slug: 'willys',
		storeName: 'Willys',
		meta: {
			title: 'Kvitto från Willys i appen — importera till skafferiet',
			description:
				'Ladda upp ditt Willys-kvitto (PDF eller bild från Kivra eller Willys-appen) i Skaffu. Varorna hamnar i skafferiet — butiksneutralt och gratis att börja.',
			ogTitle: 'Willys-kvitto i Skaffu — från kvitto till skafferi',
			ogDescription:
				'Importera Willys-kvitton till din delade inköpslista och skafferi. Du granskar raderna innan de sparas.'
		},
		h1: 'Willys-kvitto rakt in i skafferiet',
		lead: 'Handlar ni på Willys? Ladda upp det digitala kvittot i Skaffu så fyller vi skafferiet åt er — och nästa lista blir mer träffsäker.',
		points: [
			'Digitalt Willys-kvitto finns via Kivra och Willys-appen — spara som PDF eller bild.',
			'Skaffu läser av raderna och föreslår plats och hållbarhet; du granskar innan något sparas.',
			'Butiksneutralt — samma lista och skafferi oavsett var nästa handling sker.'
		],
		steps: commonSteps('Willys'),
		faq: [
			{
				question: 'Får jag digitalt kvitto från Willys?',
				answer:
					'Willys erbjuder digitala kvitton via Kivra och Willys-appen. Spara kvittot som PDF eller ta en bild och ladda upp det i Skaffu.'
			},
			{
				question: 'Sparar Skaffu mina kvitton hos Willys?',
				answer:
					'Nej. Skaffu är butiksneutralt och kopplar inte ihop sig med Willys. Kvittot du laddar upp stannar i ditt eget hushåll i Skaffu.'
			},
			{
				question: 'Vad kostar det?',
				answer: 'Det är gratis att börja. Du kan skapa konto och importera kvitton på gratisplanen.'
			}
		]
	},
	{
		slug: 'hemkop',
		storeName: 'Hemköp',
		meta: {
			title: 'Kvitto från Hemköp i appen — importera till skafferiet',
			description:
				'Ladda upp ditt Hemköp-kvitto (PDF eller bild från Kivra eller Hemköp-appen) i Skaffu. Varorna hamnar i skafferiet — butiksneutralt och gratis att börja.',
			ogTitle: 'Hemköp-kvitto i Skaffu — från kvitto till skafferi',
			ogDescription:
				'Importera Hemköp-kvitton till din delade inköpslista och skafferi. Du granskar raderna innan de sparas.'
		},
		h1: 'Hemköp-kvitto rakt in i skafferiet',
		lead: 'Handlar ni på Hemköp? Ladda upp det digitala kvittot i Skaffu så fyller vi skafferiet åt er — och veckans lista lär sig vad ni brukar behöva.',
		points: [
			'Digitalt Hemköp-kvitto finns via Kivra och Hemköp-appen — spara som PDF eller bild.',
			'Skaffu läser av raderna och föreslår plats och hållbarhet; du granskar innan något sparas.',
			'Butiksneutralt — ett hushåll, en lista, oavsett kedja.'
		],
		steps: commonSteps('Hemköp'),
		faq: [
			{
				question: 'Får jag digitalt kvitto från Hemköp?',
				answer:
					'Hemköp erbjuder digitala kvitton via Kivra och Hemköp-appen. Spara kvittot som PDF eller ta en bild och ladda upp det i Skaffu.'
			},
			{
				question: 'Sparar Skaffu mina kvitton hos Hemköp?',
				answer:
					'Nej. Skaffu är butiksneutralt och kopplar inte ihop sig med Hemköp. Kvittot du laddar upp stannar i ditt eget hushåll i Skaffu.'
			},
			{
				question: 'Vad kostar det?',
				answer: 'Det är gratis att börja. Du kan skapa konto och importera kvitton på gratisplanen.'
			}
		]
	}
];

const STORE_GUIDE_BY_SLUG = new Map(STORE_GUIDES.map((guide) => [guide.slug, guide]));

export function getStoreGuide(slug: string): StoreGuide | null {
	return STORE_GUIDE_BY_SLUG.get(slug) ?? null;
}

export function getStoreGuideSlugs(): string[] {
	return STORE_GUIDES.map((guide) => guide.slug);
}

/** Store pages for the sitemap — stable content date (bump with the copy, not per deploy). */
export function getStoreGuideSitemapEntries(): SitemapEntry[] {
	return STORE_GUIDES.map((guide) => ({
		path: `/kvitto/${guide.slug}`,
		changefreq: 'monthly' as const,
		priority: 0.7,
		lastmod: MARKETING_CONTENT_LASTMOD
	}));
}
