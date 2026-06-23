/** Shared AI prompt fragments for grocery/inventory flows (single source of truth). */

export const LOCATION_RULES = [
	'- location per vara: fridge | freezer | cupboard (förvaring hemma)',
	'  - fridge: mejeri, kött, fisk, chark, färdigrätter, färska grönsaker, ägg, mat som ska kylas',
	'  - freezer: frysta varor, glass, djupfryst',
	'  - cupboard: torrvaror (ris, pasta torr, mjöl), konserver, kryddor, kaffe, te, drycker som inte kräver kyl'
].join('\n');

export const UNIT_RULES = [
	'- quantity: numerisk mängd som sträng med punkt som decimal (t.ex. "1", "1.5", "0.45")',
	'- Synlig förpackning (1,5L, 500 g): sätt quantity till storleken, unit till enheten',
	'- Flera stycken utan tydlig storlek: antal köpta och unit "st" eller tom',
	'- Lösvikt: vikten i quantity, unit "kg"',
	'- En vara utan storlek: quantity "1", unit tom',
	'- unit: l, ml, kg, g, st, pack — tom sträng om okänd'
].join('\n');

export const SWEDISH_GROCERY_CONTEXT =
	'Svenska butiker (ICA, Willys, Coop, Hemköp, Lidl). Produktnamn på svenska. Priser i SEK med komma som decimaltecken på kvitto.';

/** Store-chain parsing hints for receipt text (3–5 lines per chain). */
export const STORE_CHAIN_HINTS: Record<string, string> = {
	ICA: [
		'ICA: egna märken GARANT, MAX, ECO; rad kan ha vikt×pris (0,450 kg × 89,00).',
		'Maxi/Kvantum: långa EAN-rader — produktnamn före pris.',
		'Hoppa pant, stammisrabatt och butiksinfo.'
	].join('\n'),
	Kivra: [
		'Kivra-PDF: radbrytning mitt i produktnamn — slå ihop till en rad.',
		'Butiksnamn ofta i header; datum nära "Kvitto".',
		'Pris kan ligga på nästa rad efter produktnamn.'
	].join('\n'),
	Willys: [
		'Willys: Garant/Eldorado-märken; kilopris på chark.',
		'Kolumnformat med pris höger — produktnamn till vänster.'
	].join('\n'),
	Coop: [
		'Coop: Xtra/Änglamark; medlemspris kan duplicera rad — ta senaste pris.',
		'Viktvaror: "kg" i quantity.'
	].join('\n'),
	'Hemköp': ['Hemköp: liknar ICA-layout; Garant/Eldorado.', 'Hoppa pant och totalsummor.'].join('\n')
};

export function storeChainHintBlock(chain: string | null | undefined): string {
	if (!chain) return '';
	const key = Object.keys(STORE_CHAIN_HINTS).find((k) => k.toLowerCase() === chain.toLowerCase());
	if (!key) return `Butikskedja: ${chain}.`;
	return `Butikskedja (${key}):\n${STORE_CHAIN_HINTS[key]}`;
}

export const SHELF_LIFE_CATEGORY_ANCHORS = [
	'Ankardagar från inköp (interpolera, var försiktig vid osäkerhet):',
	'- mejeri kyl: 5–10 d',
	'- färsk fisk: 1–2 d',
	'- kött/chark kyl: 2–7 d',
	'- grönsaker kyl: 5–10 d',
	'- torrvara skafferi: 60–180 d',
	'- fryst: 90–365 d',
	'- bröd: 3–7 d'
].join('\n');
