import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import type { SitemapEntry } from '$lib/seo/seo';
import { countGuideWords } from '$lib/marketing/guide-quality';
import { appendSearchParamsToAppPath } from '$lib/marketing/utm-params';

const GUIDES_CONTENT_DIR = join(process.cwd(), 'content/guides/sv');

export interface GuideFrontmatter {
	title: string;
	description: string;
	date: string;
	keywords: string[];
	published: boolean;
}

export interface Guide extends GuideFrontmatter {
	slug: string;
	body: string;
	html: string;
	wordCount: number;
}

export interface GuideListItem {
	slug: string;
	title: string;
	description: string;
	date: string;
	keywords: string[];
}

/** SEO keyword batches for the AI generator (from COMPETITIVE_ANALYSIS §10). */
export const GUIDE_KEYWORD_MATRIX = [
	{
		topic: 'minska matsvinn hemma',
		primaryKeyword: 'minska matsvinn hemma app',
		angle: 'Lager som sanningskälla, utgångsdatum och Veckan fixad'
	},
	{
		topic: 'skafferi app hushåll',
		primaryKeyword: 'skafferi app hushåll',
		angle: 'Butiksneutralt skafferi för hela familjen'
	},
	{
		topic: 'inköpslista kylskåp synka',
		primaryKeyword: 'inköpslista kylskåp synka',
		angle: 'Inköpslista som speglar kyl, frys och skafferi'
	},
	{
		topic: 'kvitto pdf inköpslista',
		primaryKeyword: 'kvitto pdf till inköpslista',
		angle: 'Kivra-PDF och kvitto-autopilot i Skaffu'
	},
	{
		topic: 'utgångsdatum kylskåp',
		primaryKeyword: 'utgångsdatum kylskåp app',
		angle: 'Ät det först och varningar innan mat kastas'
	},
	{
		topic: 'butiksneutral inköpslista',
		primaryKeyword: 'butiksneutral inköpslista',
		angle: 'Jämförelse mot ICA/Bring utan kedjelåsning'
	}
] as const;

/** Slug for a guide file from its primary SEO keyword (matches generate-guide-article.ts). */
export function slugForGuideKeyword(primaryKeyword: string): string {
	return primaryKeyword
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

/** First keyword-matrix index without a guide file, or null when the queue is empty. */
export function resolveNextGuideKeywordIndex(): number | null {
	for (let index = 0; index < GUIDE_KEYWORD_MATRIX.length; index++) {
		const slug = slugForGuideKeyword(GUIDE_KEYWORD_MATRIX[index].primaryKeyword);
		if (!existsSync(join(GUIDES_CONTENT_DIR, `${slug}.md`))) {
			return index;
		}
	}
	return null;
}

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		return { frontmatter: {}, body: raw.trim() };
	}

	const frontmatter: Record<string, unknown> = {};
	let currentKey: string | null = null;
	let arrayItems: string[] = [];

	const flushArray = () => {
		if (currentKey) {
			frontmatter[currentKey] = arrayItems;
			arrayItems = [];
			currentKey = null;
		}
	};

	for (const line of match[1].split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}

		const arrayItem = trimmed.match(/^- (.+)$/);
		if (arrayItem && currentKey) {
			arrayItems.push(arrayItem[1].trim().replace(/^["']|["']$/g, ''));
			continue;
		}

		flushArray();

		const kv = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
		if (!kv) {
			continue;
		}

		const key = kv[1];
		const value = kv[2].trim();

		if (!value) {
			currentKey = key;
			arrayItems = [];
			continue;
		}

		if (value === 'true') {
			frontmatter[key] = true;
		} else if (value === 'false') {
			frontmatter[key] = false;
		} else {
			frontmatter[key] = value.replace(/^["']|["']$/g, '');
		}
	}

	flushArray();

	return { frontmatter, body: match[2].trim() };
}

function normalizeFrontmatter(
	slug: string,
	raw: Record<string, unknown>
): GuideFrontmatter | null {
	const title = typeof raw.title === 'string' ? raw.title.trim() : '';
	const description = typeof raw.description === 'string' ? raw.description.trim() : '';
	const date = typeof raw.date === 'string' ? raw.date.trim() : '';
	const published = raw.published === true;
	const keywords = Array.isArray(raw.keywords)
		? raw.keywords.filter((item): item is string => typeof item === 'string')
		: typeof raw.keywords === 'string'
			? raw.keywords.split(',').map((item) => item.trim()).filter(Boolean)
			: [];

	if (!title || !description || !date) {
		console.warn(`[guides] skipping ${slug}: missing title, description, or date`);
		return null;
	}

	return { title, description, date, keywords, published };
}

function readGuideFile(slug: string): Guide | null {
	const filePath = join(GUIDES_CONTENT_DIR, `${slug}.md`);
	if (!existsSync(filePath)) {
		return null;
	}

	const raw = readFileSync(filePath, 'utf8');
	const { frontmatter: rawFrontmatter, body } = parseFrontmatter(raw);
	const frontmatter = normalizeFrontmatter(slug, rawFrontmatter);
	if (!frontmatter) {
		return null;
	}

	return {
		slug,
		...frontmatter,
		body,
		html: marked.parse(body) as string,
		wordCount: countGuideWords(body)
	};
}

export function listGuideSlugs(): string[] {
	if (!existsSync(GUIDES_CONTENT_DIR)) {
		return [];
	}

	return readdirSync(GUIDES_CONTENT_DIR)
		.filter((name) => name.endsWith('.md'))
		.map((name) => name.replace(/\.md$/, ''))
		.sort();
}

export function loadAllGuides(): Guide[] {
	return listGuideSlugs()
		.map((slug) => readGuideFile(slug))
		.filter((guide): guide is Guide => guide !== null);
}

export function loadPublishedGuides(): Guide[] {
	return loadAllGuides()
		.filter((guide) => guide.published)
		.sort((a, b) => b.date.localeCompare(a.date));
}

export function loadGuideBySlug(slug: string): Guide | null {
	const guide = readGuideFile(slug);
	if (!guide || !guide.published) {
		return null;
	}
	return guide;
}

export function toGuideListItem(guide: Guide): GuideListItem {
	return {
		slug: guide.slug,
		title: guide.title,
		description: guide.description,
		date: guide.date,
		keywords: guide.keywords
	};
}

export function getLatestPublishedGuides(limit = 3): GuideListItem[] {
	return loadPublishedGuides().slice(0, limit).map(toGuideListItem);
}

export function getPublishedGuideSitemapEntries(): SitemapEntry[] {
	return loadPublishedGuides().map((guide) => ({
		path: `/guider/${guide.slug}`,
		changefreq: 'monthly' as const,
		priority: 0.75
	}));
}

/** UTM params for guide CTA links: utm_campaign=seo-guide&utm_content={slug}. */
export function guideCtaSearchParams(slug: string): URLSearchParams {
	const params = new URLSearchParams();
	params.set('utm_campaign', 'seo-guide');
	params.set('utm_content', slug);
	return params;
}

export function guideRegisterUrl(slug: string, registerPath: string): string {
	return appendSearchParamsToAppPath(registerPath, guideCtaSearchParams(slug));
}
