import { isStorageLocation, type StorageLocation } from './location';

/** Lowercase fold for Swedish product names on receipts. */
function normalizeName(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.trim();
}

const FREEZER_RE =
	/\b(fryst|frysta|frozen|djupfryst|frys(?:en|varor)?|fryspizza|fryskött|fryskyckling|frysgrönsaker|fryspäron|frysta\s)\b|isglass|\bglass\b(?!\s*(burk|flaska))/;

const FRIDGE_RE =
	/\b(mjölk|mjolk|milk|yoghurt|yogurt|fil\b|gräddfil|gradfil|ost\b|osts\b|\w+ost\b|gouda|cheddar|cheese|smör|smor|butter|grädde|gradde|cream|kefir|kvarg|créme|creme\s+fraiche)\b|\b(kött|kott|fläsk|flask|nöt|notkött|kyckling|chicken|kalkon|färs|fars|bacon|skinka|korv|chark|leverpastej|rökt\s+lax|laxfilé|laxfile|fiskfilé|fiskfile|tonfisk\s+färsk)\b|\b(färdigrätt|fardigratt|färdigmat|fardigmat|färdig\s|fardig\s|bolognese|lasagne|gratäng|gratang|pyttipanna|wok\s|soppa\s+färsk|pasta\s+bolognese|pasta\s+carbonara|färdig\s+pasta)\b|\b(sallad|grönsaker|gronsaker|tomat\b|gurka|paprika\s+färsk|ägg\b|agg\b|juice\s+färsk|äppeljuice\s|apelsinjuice\s)\b|\b(marinerad|färskost|farskost)\b/;

const CUPBOARD_HINT_RE =
	/\b(ris\b|pasta\b(?!\s+(bolognese|carbonara))|mjöl|mjol|socker|krydda|buljong|konserver|burk\s|torkad|torr\b|havregryn|müsli|musli|kaffe|te\b|olja\b|vinäger|vinager|couscous|quinoa|nudlar\s+torr)\b/;

/**
 * Heuristic storage location from a Swedish grocery product name (ICA/Kivra style).
 * Used when receipt AI omits or returns an invalid location.
 */
export function guessStorageLocation(name: string): StorageLocation {
	const n = normalizeName(name);
	if (!n) return 'cupboard';

	if (FREEZER_RE.test(n)) return 'freezer';

	if (FRIDGE_RE.test(n)) return 'fridge';

	if (CUPBOARD_HINT_RE.test(n)) return 'cupboard';

	return 'cupboard';
}

export function resolveReceiptLineLocation(
	name: string,
	rawLocation: unknown
): StorageLocation {
	if (typeof rawLocation === 'string' && isStorageLocation(rawLocation)) {
		return rawLocation;
	}
	return guessStorageLocation(name);
}
