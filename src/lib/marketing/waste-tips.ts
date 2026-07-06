/**
 * Weekly-rotating matsvinnstips. At low volume there is no live data stream to make "/" fresh,
 * so instead of faking metrics we rotate an honest, curated tip by ISO week — genuine
 * week-over-week change on the page, clearly labelled as a tip (not a statistic).
 */
export interface WasteTip {
	tip: string;
	detail: string;
}

export const WASTE_TIPS: WasteTip[] = [
	{
		tip: 'Ställ det som går ut snart längst fram i kylen',
		detail: 'En "ät först"-hylla i ögonhöjd gör att inget glöms bort längst bak.'
	},
	{
		tip: 'Handla efter skafferiet, inte tvärtom',
		detail: 'Kolla vad ni redan har hemma innan ni skriver listan — mindre dubbelköp.'
	},
	{
		tip: 'Frys in bröd i portioner',
		detail: 'Skivat bröd tinar på minuter i brödrosten och slängs mer sällan.'
	},
	{
		tip: 'Datummärkningen är en riktlinje, inte en deadline',
		detail: '"Bäst före" betyder ofta fullt ätbart — lita på lukt och smak på torrvaror och mejeri.'
	},
	{
		tip: 'Laga "töm kylen"-middag en gång i veckan',
		detail: 'En soppa, wok eller frittata av det som återstår räddar mycket från soporna.'
	},
	{
		tip: 'Förvara grönsaker rätt',
		detail: 'Morötter och rotfrukter håller längst svalt och mörkt; örter som en blombukett i vatten.'
	},
	{
		tip: 'Skriv listan tillsammans',
		detail: 'När hela hushållet ser samma lista blir det färre "jag trodde vi var slut"-köp.'
	},
	{
		tip: 'Ta en bild eller skanna kvittot',
		detail: 'Då vet ni vad som faktiskt kom hem — och nästa veckas lista blir mer träffsäker.'
	}
];

/** ISO-8601 week number (1–53) for stable, timezone-independent weekly rotation. */
export function isoWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getWeeklyWasteTip(date: Date, tips: WasteTip[] = WASTE_TIPS): WasteTip {
	const index = (isoWeekNumber(date) - 1) % tips.length;
	return tips[index];
}
