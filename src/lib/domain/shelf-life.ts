import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';
import {
	GLOBAL_SHELF_LIFE_KEYWORDS,
	guessDaysFromCategoryHint
} from '$lib/domain/shelf-life-global-categories';

const HEURISTIC_DAYS: Record<string, number> = {
	mjölk: 7,
	milk: 7,
	grädde: 5,
	cream: 5,
	yoghurt: 14,
	yogurt: 14,
	ost: 21,
	cheese: 21,
	ägg: 21,
	egg: 21,
	äg: 21,
	bröd: 5,
	bread: 5,
	bulle: 3,
	bagett: 3,
	färs: 2,
	ground: 2,
	kyckling: 3,
	chicken: 3,
	fläsk: 3,
	pork: 3,
	nöt: 3,
	beef: 3,
	fisk: 2,
	fish: 2,
	lax: 2,
	salmon: 2,
	sallad: 5,
	salad: 5,
	tomater: 7,
	tomato: 7,
	gurka: 7,
	cucumber: 7,
	paprika: 7,
	pepper: 7,
	banan: 5,
	banana: 5,
	äpple: 14,
	apple: 14,
	pasta: 365,
	ris: 365,
	rice: 365,
	havre: 180,
	oats: 180,
	müsli: 180,
	muesli: 180,
	konserver: 730,
	canned: 730,
	sylt: 90,
	jam: 90,
	smör: 30,
	butter: 30,
	juice: 7,
	saft: 7,
	kefir: 14,
	cottage: 10,
	quark: 10,
	hummus: 7,
	tofu: 7,
	soja: 7,
	soy: 7,
	korv: 7,
	falukorv: 14,
	skinka: 10,
	bacon: 7,
	leverpastej: 21,
	röra: 5,
	rora: 5,
	sås: 14,
	sas: 14,
	bär: 5,
	bar: 5,
	jordgubb: 4,
	blåbär: 7,
	blabar: 7,
	hallon: 4,
	spenat: 4,
	broccoli: 5,
	morot: 14,
	morötter: 14,
	morotter: 14,
	potatis: 21,
	lök: 21,
	lok: 21,
	avokado: 4,
	druvor: 5,
	cola: 90,
	pepsi: 90,
	fanta: 90,
	sprite: 90,
	vatten: 180,
	öl: 120,
	ol: 120,
	vin: 365,
	filmjölk: 10,
	filmjolk: 10,
	kvarg: 10,
	crème: 10,
	creme: 10,
	färskost: 14,
	farskost: 14,
	pizza: 3,
	lasagne: 3,
	bolognese: 3,
	wok: 4,
	soppa: 5,
	glass: 90,
	paj: 3,
	tacos: 3,
	lingon: 90,
	lingonsylt: 90,
	ketchup: 90,
	mayonnaise: 60,
	majonnäs: 60,
	majonnas: 60,
	senap: 180,
	müslibar: 120,
	muslibar: 120,
	nötter: 90,
	notter: 90,
	mandel: 90,
	olivolja: 365,
	rapsolja: 365,
	farin: 365,
	mjöl: 180,
	mjol: 180,
	socker: 730,
	honung: 365,
	te: 730,
	kaffe: 180,
	kakao: 365,
	choklad: 180,
	chips: 60,
	kex: 90,
	granola: 90,
	tortilla: 14,
	wrap: 14,
	naan: 5,
	pitabröd: 5,
	pitabrod: 5,
	...GLOBAL_SHELF_LIFE_KEYWORDS
};

const TOKEN_STOP_WORDS = new Set([
	'ica',
	'arla',
	'garant',
	'eldorado',
	'fryst',
	'färsk',
	'farsk',
	'eko',
	'ekologisk',
	'klass',
	'original',
	'light',
	'laktosfri'
]);

function addDaysIso(from: Date, days: number): string {
	const date = new Date(from);
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

function locationBonus(location: StorageLocation): number {
	if (location === 'freezer') return 90;
	if (location === 'cupboard') return 30;
	return 0;
}

function firstSignificantToken(name: string): string | null {
	const tokens = name
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.split(/\s+/)
		.filter((token) => token.length > 2 && !TOKEN_STOP_WORDS.has(token));
	return tokens[0] ?? null;
}

function keywordMatches(normalized: string, keyword: string): boolean {
	const tokens = normalized.split(/\s+/);
	if (keyword.length >= 4) {
		return normalized.includes(keyword);
	}
	return tokens.some(
		(token) =>
			token === keyword ||
			token.startsWith(keyword) ||
			(keyword.length >= 3 && token.endsWith(keyword) && token.length > keyword.length)
	);
}

function heuristicTypicalDays(name: string, location: StorageLocation): number | null {
	const normalized = name.toLowerCase();
	const bonus = locationBonus(location);
	for (const [keyword, days] of Object.entries(HEURISTIC_DAYS)) {
		if (keywordMatches(normalized, keyword)) {
			return days + bonus;
		}
	}
	const firstToken = firstSignificantToken(name);
	if (firstToken && firstToken in HEURISTIC_DAYS) {
		return HEURISTIC_DAYS[firstToken] + bonus;
	}
	return null;
}

export function guessShelfLifeTypicalDays(
	name: string,
	location: StorageLocation,
	categoryHint?: string | null
): number | null {
	const fromHint = guessDaysFromCategoryHint(categoryHint, location);
	if (fromHint != null) return fromHint;
	return heuristicTypicalDays(name, location);
}

export function guessShelfLife(name: string, location: StorageLocation) {
	const typicalDays = heuristicTypicalDays(name, location);
	if (typicalDays == null) return null;
	return {
		expiresOn: addDaysIso(new Date(), typicalDays),
		source: 'ai_inferred' as ExpiresOnSource
	};
}
