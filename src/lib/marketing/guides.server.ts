import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import type { GuideArticle } from '$lib/domain/guide-article';
import type { SitemapEntry } from '$lib/seo/seo';
import { countGuideWords } from '$lib/marketing/guide-quality';
import {
	GUIDE_KEYWORD_MATRIX,
	slugForGuideKeyword,
	type Guide,
	type GuideFrontmatter,
	type GuideListItem
} from '$lib/marketing/guides';

const GUIDES_CONTENT_DIR = join(process.cwd(), 'content/guides/sv');

/** First keyword-matrix index without a guide file or DB slug, or null when the queue is empty. */
export function resolveNextGuideKeywordIndex(extraSlugs: Iterable<string> = []): number | null {
	const taken = new Set(extraSlugs);
	for (let index = 0; index < GUIDE_KEYWORD_MATRIX.length; index++) {
		const slug = slugForGuideKeyword(GUIDE_KEYWORD_MATRIX[index].primaryKeyword);
		if (!existsSync(join(GUIDES_CONTENT_DIR, `${slug}.md`)) && !taken.has(slug)) {
			return index;
		}
	}
	return null;
}

export interface GuideLoaderDeps {
	listPublishedFromDb?: () => Promise<GuideArticle[]>;
	getPublishedBySlugFromDb?: (slug: string) => Promise<GuideArticle | null>;
}

export function guideArticleToGuide(article: GuideArticle): Guide {
	const html = marked.parse(article.body) as string;
	return {
		slug: article.slug,
		title: article.title,
		description: article.description,
		date: article.articleDate,
		keywords: article.keywords,
		published: article.status === 'published',
		body: article.body,
		html,
		wordCount: countGuideWords(article.body)
	};
}

/** Merge filesystem and DB guides; DB wins on slug conflict. */
export function mergeGuides(fileGuides: Guide[], dbGuides: Guide[]): Guide[] {
	const bySlug = new Map<string, Guide>();
	for (const guide of fileGuides) {
		bySlug.set(guide.slug, guide);
	}
	for (const guide of dbGuides) {
		bySlug.set(guide.slug, guide);
	}
	return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
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

	let html: string;
	try {
		html = marked.parse(body) as string;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`[guides] markdown parse failed for ${slug}: ${message}`);
		return null;
	}

	return {
		slug,
		...frontmatter,
		body,
		html,
		wordCount: countGuideWords(body)
	};
}

export function listGuideSlugs(): string[] {
	if (!existsSync(GUIDES_CONTENT_DIR)) {
		return [];
	}

	try {
		return readdirSync(GUIDES_CONTENT_DIR)
			.filter((name) => name.endsWith('.md'))
			.map((name) => name.replace(/\.md$/, ''))
			.sort();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`[guides] failed to list ${GUIDES_CONTENT_DIR}: ${message}`);
		return [];
	}
}

export function loadAllGuidesFromFiles(): Guide[] {
	return listGuideSlugs()
		.map((slug) => readGuideFile(slug))
		.filter((guide): guide is Guide => guide !== null);
}

export function loadAllGuides(): Guide[] {
	return loadAllGuidesFromFiles();
}

export async function loadAllGuidesMerged(deps?: GuideLoaderDeps): Promise<Guide[]> {
	const fileGuides = loadAllGuidesFromFiles();
	if (!deps?.listPublishedFromDb) {
		return fileGuides;
	}
	const dbArticles = await deps.listPublishedFromDb();
	const dbGuides = dbArticles.map(guideArticleToGuide);
	return mergeGuides(fileGuides, dbGuides);
}

export function loadPublishedGuidesFromFiles(): Guide[] {
	return loadAllGuidesFromFiles()
		.filter((guide) => guide.published)
		.sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadPublishedGuides(deps?: GuideLoaderDeps): Promise<Guide[]> {
	const fileGuides = loadAllGuidesFromFiles();
	if (!deps?.listPublishedFromDb) {
		return fileGuides.filter((guide) => guide.published).sort((a, b) => b.date.localeCompare(a.date));
	}
	const dbArticles = await deps.listPublishedFromDb();
	const dbGuides = dbArticles.map(guideArticleToGuide);
	return mergeGuides(fileGuides, dbGuides).filter((guide) => guide.published);
}

function loadPublishedGuideFromFile(slug: string): Guide | null {
	const guide = readGuideFile(slug);
	if (!guide || !guide.published) {
		return null;
	}
	return guide;
}

export async function loadGuideBySlug(slug: string, deps?: GuideLoaderDeps): Promise<Guide | null> {
	if (deps?.getPublishedBySlugFromDb) {
		const dbArticle = await deps.getPublishedBySlugFromDb(slug);
		if (dbArticle) {
			return guideArticleToGuide(dbArticle);
		}
	}
	return loadPublishedGuideFromFile(slug);
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

export async function getLatestPublishedGuides(limit = 3, deps?: GuideLoaderDeps): Promise<GuideListItem[]> {
	const guides = await loadPublishedGuides(deps);
	return guides.slice(0, limit).map(toGuideListItem);
}

export async function getPublishedGuideSitemapEntries(deps?: GuideLoaderDeps): Promise<SitemapEntry[]> {
	const guides = await loadPublishedGuides(deps);
	return guides.map((guide) => ({
		path: `/guider/${guide.slug}`,
		changefreq: 'monthly' as const,
		priority: 0.75
	}));
}
