/**
 * Documented content rules for AI-generated Skaffu SEO guides.
 * Used in the generator prompt and referenced from docs/MARKETING_SITE.md.
 */

/** Editorial rules injected into the OpenAI generation prompt. */
export const GUIDE_AI_CONTENT_RULES = [
	'Håll dig till mat, hem, inköp, skafferi, matsvinn, priser och hushållsekonomi — inget utanför Skaffus tema.',
	'Skriv på svenska med professionell, praktisk ton för vanliga hushåll — inte clickbait eller sensationalism.',
	'Positionera Skaffu ärligt och butiksneutralt; inga påhittade butiksintegrationer utöver PDF/Kivra.',
	'Inga medicinska, nutritions- eller hälsopåståenden utöver grundläggande matsäkerhet och utgångsdatum.',
	'Inga politiska ställningstaganden, valpropaganda eller brott/kändisnyheter.',
	'Uppfinn inga fakta, citat, statistik eller studier — skriv bara det du kan motivera generellt.',
	'Vid koppling till aktuella nyheter: attributera försiktigt (t.ex. "enligt rapportering …") utan att hitta på citat.',
	'Jämför konkurrenter sakligt om det behövs — ingen förtal eller överdrift.',
	'YMYL-försiktighet: ge inte hälso- eller medicinsk rådgivning utanför skafferiområdet.',
	'Nämn att kvitto-AI kräver granskning; inga garantier om "gratis för alltid" eller fabricerad prissättning.'
] as const;

/** Short policy summary for documentation tables. */
export const GUIDE_AI_POLICY_SUMMARY = {
	tone: 'Professionell svenska för praktiska hushåll, butiksneutralt',
	topics: 'Mat, skafferi, inköp, matsvinn, priser, utgångsdatum, kvitton',
	forbidden:
		'Fabricerade fakta, medicinska/konspirationspåståenden, politik, sensationalism, förtal',
	news: 'Generera endast när SVT-rubrik är relevant; attributera försiktigt utan påhittade citat'
} as const;
