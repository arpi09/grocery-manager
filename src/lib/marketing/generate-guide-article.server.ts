import { GUIDE_AI_CONTENT_RULES } from '$lib/marketing/guide-generation-rules';
import {
	formatNewsContextForPrompt,
	resolveGuideNewsContext
} from '$lib/marketing/guide-news-context';
import { validateGuideQuality } from '$lib/marketing/guide-quality';
import { GUIDE_KEYWORD_MATRIX, slugForGuideKeyword } from '$lib/marketing/guides';
import { resolveNextGuideKeywordIndex } from '$lib/marketing/guides.server';
import type { GuideArticle } from '$lib/domain/guide-article';
import type { SocialPost } from '$lib/domain/social-post';
import type { GuideArticleService } from '$lib/application/guide-article.service';
import type { SocialPostService } from '$lib/application/social-post.service';
import {
	extractResponseOutputText,
	OPENAI_MODEL,
	openAiFailureMessageKey,
	mapOpenAiFailureStatus
} from '$lib/server/openai';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

export const GUIDE_LINKEDIN_UTM = {
	utmSource: 'linkedin',
	utmMedium: 'social',
	utmCampaign: 'guide_link'
} as const;

export interface GeneratedGuideContent {
	title: string;
	description: string;
	keywords: string[];
	body: string;
	slug: string;
	articleDate: string;
	qualityWarnings: string[];
	wordCount: number;
}

export interface GenerateMarketingCampaignDeps {
	apiKey: string;
	guideArticleService: GuideArticleService;
	socialPostService: SocialPostService;
	existingSlugs?: string[];
	skipNewsCheck?: boolean;
}

export type GenerateMarketingCampaignResult =
	| { ok: true; guide: GuideArticle; socialPost: SocialPost }
	| { ok: false; error: 'queue_empty' | 'openai_failed' | 'parse_failed' | 'slug_conflict'; detail?: string };

function stripCodeFences(raw: string): string {
	return raw.replace(/^```(?:markdown|md)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function buildGenerationPrompt(input: {
	batch: { primaryKeyword: string; angle: string };
	today: string;
	newsContext?: string;
}): string {
	const rulesBlock = GUIDE_AI_CONTENT_RULES.map((rule) => `- ${rule}`).join('\n');
	const newsBlock = input.newsContext
		? `\n\nNyhetskontext (valfritt men relevant):\n${input.newsContext}`
		: '';

	return `Du skriver en SEO-guide på svenska för Skaffu (skafferi-app, skaffu.com).

Primärt sökord: ${input.batch.primaryKeyword}
Vinkel: ${input.batch.angle}

Redaktionella regler (följ alla):
${rulesBlock}

Krav:
- Minst 850 ord i brödtexten (markdown efter frontmatter).
- Frontmatter med title, description (120-160 tecken), date (${input.today}), keywords (3-5), published: false.
- Minst en intern länk till /register, /kvitto-pdf-kivra eller /guider/...
- Länka naturligt till befintliga sidor: /minska-matsvinn, /skafferi-app, /kvitto-pdf-kivra där det passar.
- Skriv ärligt om Skaffu: gratisplan finns, Pro från cirka 39 kr/mån — inga garantier eller "gratis för alltid".
- Nämn att kvitto-AI kräver granskning; inga påhittade butiksintegrationer utöver PDF/Kivra.
- Uppfinn inga fakta, citat, studier eller medicinska råd utanför skafferiområdet.
- Svara ENDAST med komplett markdown-fil (frontmatter + artikel), inga kodblock runt hela svaret.

Struktur: H1 i frontmatter title (inte i body), 5-7 H2-sektioner, punktlistor där det hjälper, avsluta med CTA-länk till /register.
Inkludera ett avsnitt "Så här kan det se ut i vardagen" med 2–3 korta användarscenarier (par/hushåll med delad inköpslista, kvitto→skafferi, äta-först).${newsBlock}`;
}

export function parseGeneratedMarkdown(raw: string): {
	title: string;
	description: string;
	keywords: string[];
	body: string;
} {
	const cleaned = stripCodeFences(raw);
	const frontmatterMatch = cleaned.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!frontmatterMatch) {
		throw new Error('Model output missing YAML frontmatter block');
	}

	const frontmatterRaw = frontmatterMatch[1];
	const body = frontmatterMatch[2].trim();
	const title =
		frontmatterRaw.match(/^title:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, '').trim() ?? '';
	const description =
		frontmatterRaw.match(/^description:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, '').trim() ?? '';
	const keywords = [...frontmatterRaw.matchAll(/^-\s+(.+)$/gm)].map((m) => m[1].trim());

	if (!title || !description || !body) {
		throw new Error('Generated article missing title, description, or body');
	}

	return { title, description, keywords, body };
}

export function buildLinkedInPostBody(title: string, description: string): string {
	return `${title}\n\n${description}\n\nNy guide på skaffu.com. Prova gratis: skanna streckkod eller fota kylen.`;
}

async function callOpenAiText(apiKey: string, prompt: string): Promise<
	| { ok: true; text: string }
	| { ok: false; detail: string }
> {
	let response: Response;
	try {
		response = await fetch(OPENAI_API_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: OPENAI_MODEL,
				input: prompt
			})
		});
	} catch (error) {
		const detail = error instanceof Error ? error.message : 'network error';
		return { ok: false, detail };
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => '');
		return {
			ok: false,
			detail: `${mapOpenAiFailureStatus(response.status)}:${openAiFailureMessageKey(response.status)}:${errorText.slice(0, 200)}`
		};
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		return { ok: false, detail: 'unreadable response' };
	}

	const text = extractResponseOutputText(payload);
	if (!text.trim()) {
		return { ok: false, detail: 'empty response' };
	}

	return { ok: true, text: text.trim() };
}

export async function generateGuideContent(
	apiKey: string,
	options?: {
		skipNewsCheck?: boolean;
		existingSlugs?: string[];
		batch?: { primaryKeyword: string; angle: string; topic?: string };
		slug?: string;
	}
): Promise<
	| { ok: true; content: GeneratedGuideContent; keywordIndex: number }
	| { ok: false; error: 'queue_empty' | 'openai_failed' | 'parse_failed'; detail?: string }
> {
	let batch: { primaryKeyword: string; angle: string };
	let index: number;
	let slug: string;

	if (options?.batch) {
		batch = options.batch;
		index = GUIDE_KEYWORD_MATRIX.findIndex((row) => row.primaryKeyword === batch.primaryKeyword);
		slug = options.slug ?? slugForGuideKeyword(batch.primaryKeyword);
	} else {
		const nextIndex = resolveNextGuideKeywordIndex(options?.existingSlugs ?? []);
		if (nextIndex === null) {
			return { ok: false, error: 'queue_empty' };
		}
		index = nextIndex;
		batch = GUIDE_KEYWORD_MATRIX[index];
		slug = options?.slug ?? slugForGuideKeyword(batch.primaryKeyword);
	}

	if (!slug) {
		return { ok: false, error: 'parse_failed', detail: 'Could not derive slug' };
	}

	let newsContext: string | undefined;
	if (!options?.skipNewsCheck) {
		const news = await resolveGuideNewsContext();
		if (news.relevance?.item) {
			newsContext = formatNewsContextForPrompt(news.relevance.item, news.relevance.matchedTopics);
		}
	}

	const today = new Date().toISOString().slice(0, 10);
	const prompt = buildGenerationPrompt({ batch, today, newsContext });
	const generated = await callOpenAiText(apiKey, prompt);
	if (!generated.ok) {
		return { ok: false, error: 'openai_failed', detail: generated.detail };
	}

	let parsed: ReturnType<typeof parseGeneratedMarkdown>;
	try {
		parsed = parseGeneratedMarkdown(generated.text);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		return { ok: false, error: 'parse_failed', detail };
	}

	const quality = validateGuideQuality({
		title: parsed.title,
		description: parsed.description,
		body: parsed.body
	});

	return {
		ok: true,
		keywordIndex: index,
		content: {
			title: parsed.title,
			description: parsed.description,
			keywords: parsed.keywords.length > 0 ? parsed.keywords : [batch.primaryKeyword],
			body: parsed.body,
			slug,
			articleDate: today,
			qualityWarnings: quality.errors,
			wordCount: quality.wordCount
		}
	};
}

export async function generateMarketingCampaign(
	deps: GenerateMarketingCampaignDeps
): Promise<GenerateMarketingCampaignResult> {
	const dbSlugs = deps.existingSlugs ?? (await deps.guideArticleService.listSlugs());
	const generated = await generateGuideContent(deps.apiKey, {
		skipNewsCheck: deps.skipNewsCheck,
		existingSlugs: dbSlugs
	});

	if (!generated.ok) {
		return generated;
	}

	const { content } = generated;
	const existing = await deps.guideArticleService.getBySlug(content.slug);
	if (existing) {
		return { ok: false, error: 'slug_conflict', detail: content.slug };
	}

	const linkUrl = `https://skaffu.com/guider/${content.slug}`;
	const linkedInBody = buildLinkedInPostBody(content.title, content.description);

	const socialPost = await deps.socialPostService.createDraft({
		title: content.title,
		body: linkedInBody,
		linkUrl,
		utmSource: GUIDE_LINKEDIN_UTM.utmSource,
		utmMedium: GUIDE_LINKEDIN_UTM.utmMedium,
		utmCampaign: GUIDE_LINKEDIN_UTM.utmCampaign,
		utmContent: content.slug,
		source: 'agent'
	});

	const guide = await deps.guideArticleService.createDraft({
		slug: content.slug,
		title: content.title,
		description: content.description,
		body: content.body,
		keywords: content.keywords,
		articleDate: content.articleDate,
		socialPostId: socialPost.id,
		qualityWarnings: content.qualityWarnings.length > 0 ? content.qualityWarnings : null,
		source: 'agent'
	});

	return { ok: true, guide, socialPost };
}
