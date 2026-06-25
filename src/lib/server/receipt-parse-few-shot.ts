/** Few-shot receipt parse examples — illustrates GPT reasoning, not a brand lexicon. */
export const RECEIPT_PARSE_FEW_SHOT_BLOCK = [
	'Exempel-rader (tolkning, inte lexikon):',
	'- "Ben & Jerry\'s Half Baked 465ml" → name: Half Baked, brand: Ben & Jerry\'s, categoryHint: glass, location: freezer, confidence: 0.85',
	'- "Arla Mjölk 3% 1L" → name: Mjölk 3%, brand: Arla, categoryHint: mejeri, location: fridge, packageSize: 1L',
	'- "Findus Wok Classic 450g" → name: Wok Classic, brand: Findus, categoryHint: fryst, location: freezer',
	'- "Barilla Spaghetti 500g" → name: Spaghetti, brand: Barilla, categoryHint: torrvara, location: cupboard',
	'- "Garant Falukorv 800g" → name: Falukorv, brand: Garant, categoryHint: chark, location: fridge',
	'- "ICA Ägg 12-pack" → name: Ägg, brand: ICA, categoryHint: mejeri, location: fridge, unit: st',
	'- "Laxfilé ASC 400g" → name: Laxfilé, categoryHint: fisk, location: fridge, confidence: 0.8',
	'- "Coca-Cola Zero 1,5L" → name: Coca-Cola Zero, categoryHint: dryck, location: cupboard',
	'- "Knäckebröd Wasa 275g" → name: Knäckebröd, brand: Wasa, categoryHint: bröd, location: cupboard',
	'- "Okänd vara XYZ" → name: XYZ, categoryHint: null, lineConfidence: low, confidence: 0.35'
].join('\n');
