/**
 * SVT Nyheter RSS fetch + heuristic relevance for Skaffu guide generation.
 * Public feed — no secrets required in CI.
 */

export const SVT_NYHETER_RSS_URL = 'https://www.svt.se/nyheter/rss.xml';

export interface SvtNewsItem {
	title: string;
	link: string;
	description: string;
	pubDate: string;
}

export interface NewsRelevanceResult {
	relevant: boolean;
	item: SvtNewsItem | null;
	matchedTopics: string[];
	excludedBy: string | null;
}

/** Positive signals: Swedish households, pantry, food waste, groceries, prices. */
export const SKAFFU_NEWS_TOPIC_KEYWORDS = [
	'matsvinn',
	'matkast',
	'kast mat',
	'livsmedel',
	'matpris',
	'matpriser',
	'mat inflation',
	'matkasse',
	'inköp',
	'handla mat',
	'matbutik',
	'butik',
	'kylskåp',
	'skafferi',
	'utgångsdatum',
	'bäst före',
	'hållbarhet',
	'kvitto',
	'kvitton',
	'matplanering',
	'veckomeny',
	'hushåll',
	'familjens mat',
	'matbudget',
	'matkostnad',
	'dagligvaror',
	'förpackning',
	'retur',
	'pant',
	'frysa',
	'frys',
	'rester',
	'matsmart',
	'konsumtion'
] as const;

/** Hard exclusions: politics, crime, celebrity, unrelated health conspiracies. */
export const SKAFFU_NEWS_EXCLUSION_KEYWORDS = [
	'mord',
	'dödad',
	'dödade',
	'skjuten',
	'våldtäkt',
	'brott',
	'gäng',
	'domstol',
	'åtal',
	'politik',
	'riksdag',
	'regering',
	'val ',
	'valen',
	'partiet',
	'kändis',
	'celebrity',
	'melodifestival',
	'fotboll',
	'ishockey',
	'vm-final',
	'konspiration',
	'vaccin',
	'5g',
	'chemtrails',
	'krig',
	'ukraina',
	'israel',
	'gaza',
	'terror',
	'brand',
	'olycka',
	'krock',
	'flygkrasch'
] as const;

function decodeXmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function extractTag(block: string, tag: string): string {
	const cdata = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
	if (cdata?.[1]) {
		return decodeXmlEntities(cdata[1]);
	}
	const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
	return plain?.[1] ? decodeXmlEntities(plain[1]) : '';
}

/** Parse RSS/Atom-style XML into headline items (no external XML dependency). */
export function parseRssItems(xml: string, limit = 20): SvtNewsItem[] {
	const items: SvtNewsItem[] = [];
	const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

	for (const block of itemBlocks) {
		const title = extractTag(block, 'title');
		if (!title) {
			continue;
		}
		items.push({
			title,
			link: extractTag(block, 'link'),
			description: extractTag(block, 'description'),
			pubDate: extractTag(block, 'pubDate')
		});
		if (items.length >= limit) {
			break;
		}
	}

	return items;
}

export interface FetchSvtNewsOptions {
	limit?: number;
	fetchFn?: typeof fetch;
	url?: string;
}

/** Fetch recent SVT Nyheter headlines. Throws on HTTP/network errors. */
export async function fetchSvtNewsHeadlines(
	options: FetchSvtNewsOptions = {}
): Promise<SvtNewsItem[]> {
	const { limit = 20, fetchFn = fetch, url = SVT_NYHETER_RSS_URL } = options;
	const response = await fetchFn(url, {
		headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' }
	});
	if (!response.ok) {
		throw new Error(`SVT RSS fetch failed (${response.status})`);
	}
	const xml = await response.text();
	return parseRssItems(xml, limit);
}

function normalizeForMatch(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

/** Score a headline for Skaffu relevance; deterministic for unit tests. */
export function scoreNewsRelevance(item: SvtNewsItem): NewsRelevanceResult {
	const haystack = normalizeForMatch(`${item.title} ${item.description}`);

	for (const exclusion of SKAFFU_NEWS_EXCLUSION_KEYWORDS) {
		if (haystack.includes(normalizeForMatch(exclusion))) {
			return {
				relevant: false,
				item: null,
				matchedTopics: [],
				excludedBy: exclusion
			};
		}
	}

	const matchedTopics = SKAFFU_NEWS_TOPIC_KEYWORDS.filter((keyword) =>
		haystack.includes(normalizeForMatch(keyword))
	);

	return {
		relevant: matchedTopics.length > 0,
		item: matchedTopics.length > 0 ? item : null,
		matchedTopics: [...matchedTopics],
		excludedBy: null
	};
}

/** Pick the first relevant headline from a list (RSS order = recency). */
export function pickRelevantSvtNewsItem(items: SvtNewsItem[]): NewsRelevanceResult {
	for (const item of items) {
		const result = scoreNewsRelevance(item);
		if (result.relevant && result.item) {
			return result;
		}
	}
	return { relevant: false, item: null, matchedTopics: [], excludedBy: null };
}

export interface ResolveGuideNewsContextResult {
	mode: 'relevant' | 'not_relevant' | 'rss_unavailable';
	relevance: NewsRelevanceResult | null;
	headlines: SvtNewsItem[];
}

/**
 * Resolve whether guide generation should proceed with news context.
 * - relevant: at least one headline matches Skaffu themes
 * - not_relevant: RSS ok but no matching headline → caller should skip generation
 * - rss_unavailable: fetch failed → caller may fall back to keyword-only generation
 */
export async function resolveGuideNewsContext(
	options: FetchSvtNewsOptions = {}
): Promise<ResolveGuideNewsContextResult> {
	try {
		const headlines = await fetchSvtNewsHeadlines(options);
		const relevance = pickRelevantSvtNewsItem(headlines);
		return {
			mode: relevance.relevant ? 'relevant' : 'not_relevant',
			relevance,
			headlines
		};
	} catch {
		return { mode: 'rss_unavailable', relevance: null, headlines: [] };
	}
}

/** Format news hook for the generation prompt when a story is relevant. */
export function formatNewsContextForPrompt(item: SvtNewsItem, matchedTopics: string[]): string {
	const topics = matchedTopics.slice(0, 4).join(', ');
	return `Aktuell SVT-rubrik att koppla försiktigt (ingen påhittad statistik eller citat):
- Rubrik: ${item.title}
- Länk (referens för dig, länka inte i artikeln): ${item.link}
- Matchade teman: ${topics}
- Skriv t.ex. "enligt rapportering …" om du nämner nyheten; håll fokus på praktiska hushållstips.`;
}
