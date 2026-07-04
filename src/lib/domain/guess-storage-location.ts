import { isStorageLocation, type StorageLocation } from './location';

/** Lowercase fold for Swedish product names on receipts. */
function normalizeName(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.trim();
}

/* "glass" utan ordgräns framför — svenska sammansättningar (gräddglass, persikaglass, vaniljglass). */
const FREEZER_RE =
	/\b(fryst|frysta|frozen|djupfryst|frys(?:en|varor)?|fryspizza|fryskött|fryskyckling|frysgrönsaker|fryspäron|frysta\s)\b|glass\b(?!\s*(burk|flaska))|\b(sorbet|glasspinn\w*|glasstrut\w*)\b/;

const FRIDGE_RE =
	/\b(mjölk|mjolk|milk|filmjölk|filmjolk|kvartsmjolk|kvartsmjölk|yoghurt|yogurt|fil\b|gräddfil|graddfil|ost\b|osts\b|\w+ost\b|gouda|cheddar|cheese|smör|smor|butter|grädde|gradde|cream|kefir|kvarg|créme|creme\s+fraiche)\b|\b(kött|kott|fläsk|flask|falukorv|nöt|notkött|kyckling|kycklingfile|chicken|kalkon|färs|fars|bacon|skinka|korv|chark|leverpastej|rökt\s+lax|laxfilé|laxfile|lax\s+file|fiskfilé|fiskfile|tonfisk\s+färsk)\b|\b(färdigrätt|fardigratt|färdigmat|fardigmat|färdig\s|fardig\s|bolognese|lasagne|gratäng|gratang|pyttipanna|wok\s|soppa\s+färsk|pasta\s+bolognese|pasta\s+carbonara|färdig\s+pasta)\b|\b(sallad|grönsaker|gronsaker|tomat\b|gurka|lök\b|lok\b|morot|potatis|paprika\s+färsk|ägg\b|agg\b|äpplen\b|applen\b|banan|citron|juice\s+färsk|äppeljuice\s|apelsinjuice\s)\b|\b(marinerad|färskost|farskost)\b/;

const CUPBOARD_HINT_RE =
	/\b(ris\b|pasta\b(?!\s+(bolognese|carbonara))|mjöl|mjol|socker|krydda|buljong|konserver|burk\s|torkad|torr\b|havregryn|müsli|musli|kaffe|te\b|olja\b|vinäger|vinager|couscous|quinoa|nudlar\s+torr)\b/;

const CATEGORY_FREEZER_RE = /glass|sorbet|fryst|frysvar|djupfryst|\bfrys\b/;

const CATEGORY_FRIDGE_RE =
	/mejeri|mjolk|mjölk|\bost\b|chark|kött|kott\b|fisk|skaldjur|färskvar|farskvar|kylvar|\bkyl\b|ägg|agg\b/;

/**
 * Heuristic storage location from a Swedish grocery product name (ICA/Kivra style).
 * Used when receipt AI omits or returns an invalid location. The parse category
 * (e.g. "glass", "mejeri") breaks ties when the name alone says nothing.
 */
export function guessStorageLocation(name: string, categoryHint?: string | null): StorageLocation {
	const n = normalizeName(name);
	if (!n) return 'cupboard';

	if (FREEZER_RE.test(n)) return 'freezer';

	if (FRIDGE_RE.test(n)) return 'fridge';

	if (CUPBOARD_HINT_RE.test(n)) return 'cupboard';

	const category = categoryHint ? normalizeName(categoryHint) : '';
	if (category) {
		if (CATEGORY_FREEZER_RE.test(category)) return 'freezer';
		if (CATEGORY_FRIDGE_RE.test(category)) return 'fridge';
	}

	return 'cupboard';
}

export function resolveReceiptLineLocation(
	name: string,
	rawLocation: unknown,
	categoryHint?: string | null
): StorageLocation {
	if (typeof rawLocation === 'string' && isStorageLocation(rawLocation)) {
		return rawLocation;
	}
	return guessStorageLocation(name, categoryHint);
}
