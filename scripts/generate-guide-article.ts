/**
 * AI-assisted SEO guide generator.
 *
 * Usage:
 *   npm run guides:generate -- --keyword 0
 *   npm run guides:generate -- --topic "utgångsdatum kylskåp app"
 *   npm run guides:publish-next   # --next --publish
 *   npm run guides:generate -- --next --skip-news-check   # bypass SVT gate (local)
 *
 * Before generation (unless --skip-news-check): fetches SVT Nyheter RSS and skips
 * with exit 0 when no headline matches Skaffu themes (news_not_relevant).
 * With --publish, sets published: true only when the quality checklist passes.
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { GUIDE_KEYWORD_MATRIX, slugForGuideKeyword } from '../src/lib/marketing/guides.ts';
import { resolveNextGuideKeywordIndex } from '../src/lib/marketing/guides.server.ts';
import { GUIDE_AI_CONTENT_RULES } from '../src/lib/marketing/guide-generation-rules.ts';
import {
	formatNewsContextForPrompt,
	resolveGuideNewsContext
} from '../src/lib/marketing/guide-news-context.ts';
import { validateGuideQuality } from '../src/lib/marketing/guide-quality.ts';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-4.1-mini';
const GUIDES_DIR = join(process.cwd(), 'content/guides/sv');

interface CliOptions {
	topic?: string;
	keywordIndex?: number;
	slug?: string;
	next?: boolean;
	publish?: boolean;
	/** Bypass SVT relevance gate (local/manual runs only). */
	skipNewsCheck?: boolean;
}

function parseArgs(argv: string[]): CliOptions {
	const options: CliOptions = {};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--topic' && argv[i + 1]) {
			options.topic = argv[++i];
		} else if (arg === '--keyword' && argv[i + 1]) {
			options.keywordIndex = Number(argv[++i]);
		} else if (arg === '--slug' && argv[i + 1]) {
			options.slug = argv[++i];
		} else if (arg === '--next') {
			options.next = true;
		} else if (arg === '--publish') {
			options.publish = true;
		} else if (arg === '--skip-news-check') {
			options.skipNewsCheck = true;
		}
	}
	return options;
}

function resolveKeywordBatch(options: CliOptions) {
	if (options.next) {
		const index = resolveNextGuideKeywordIndex();
		if (index === null) {
			return null;
		}
		return { batch: GUIDE_KEYWORD_MATRIX[index], index };
	}

	if (options.topic) {
		const match = GUIDE_KEYWORD_MATRIX.find(
			(row) =>
				row.topic === options.topic ||
				row.primaryKeyword === options.topic ||
				row.primaryKeyword.includes(options.topic ?? '')
		);
		if (match) {
			return { batch: match, index: GUIDE_KEYWORD_MATRIX.indexOf(match) };
		}
		return {
			batch: {
				topic: options.topic,
				primaryKeyword: options.topic,
				angle: 'Butiksneutralt skafferi med lager som sanningskälla'
			},
			index: -1
		};
	}

	const index = options.keywordIndex ?? 0;
	const row = GUIDE_KEYWORD_MATRIX[index];
	if (!row) {
		throw new Error(`Invalid --keyword index ${index}. Use 0-${GUIDE_KEYWORD_MATRIX.length - 1}.`);
	}
	return { batch: row, index };
}

function extractResponseText(payload: unknown): string {
	if (!payload || typeof payload !== 'object') {
		return '';
	}
	const record = payload as Record<string, unknown>;
	if (typeof record.output_text === 'string' && record.output_text.trim()) {
		return record.output_text.trim();
	}
	const output = record.output;
	if (!Array.isArray(output)) {
		return '';
	}
	const parts: string[] = [];
	for (const item of output) {
		if (!item || typeof item !== 'object') {
			continue;
		}
		const row = item as Record<string, unknown>;
		if (row.type !== 'message' || !Array.isArray(row.content)) {
			continue;
		}
		for (const part of row.content) {
			if (part && typeof part === 'object' && (part as { type?: string }).type === 'output_text') {
				const text = (part as { text?: string }).text;
				if (text?.trim()) {
					parts.push(text.trim());
				}
			}
		}
	}
	return parts.join('\n').trim();
}

async function callOpenAi(prompt: string, apiKey: string): Promise<string> {
	const response = await fetch(OPENAI_API_URL, {
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

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`OpenAI request failed (${response.status}): ${detail.slice(0, 400)}`);
	}

	const payload = await response.json();
	const text = extractResponseText(payload);
	if (!text) {
		throw new Error('OpenAI returned empty response');
	}
	return text;
}

function stripCodeFences(raw: string): string {
	return raw.replace(/^```(?:markdown|md)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function buildFrontmatterBlock(input: {
	title: string;
	description: string;
	date: string;
	keywords: string[];
	published: boolean;
}): string {
	const keywordLines = input.keywords.map((kw) => `  - ${kw}`).join('\n');
	return `---
title: ${JSON.stringify(input.title)}
description: ${JSON.stringify(input.description)}
date: ${input.date}
keywords:
${keywordLines}
published: ${input.published}
---`;
}

function parseGeneratedMarkdown(raw: string): {
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
	const title = frontmatterRaw.match(/^title:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, '').trim() ?? '';
	const description =
		frontmatterRaw.match(/^description:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, '').trim() ?? '';
	const keywords = [...frontmatterRaw.matchAll(/^-\s+(.+)$/gm)].map((m) => m[1].trim());

	if (!title || !description || !body) {
		throw new Error('Generated article missing title, description, or body');
	}

	return { title, description, keywords, body };
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

Struktur: H1 i frontmatter title (inte i body), 5-7 H2-sektioner, punktlistor där det hjälper, avsluta med CTA-länk till /register.${newsBlock}`;
}

async function main(): Promise<void> {
	const apiKey = process.env.OPENAI_API_KEY?.trim();
	if (!apiKey) {
		console.error('OPENAI_API_KEY is required. Add it to .env or pass via --env-file.');
		process.exit(1);
	}

	const options = parseArgs(process.argv.slice(2));
	const resolved = resolveKeywordBatch(options);
	if (!resolved) {
		console.info('[guides:generate] queue_empty — all keyword-matrix guides already exist');
		process.exit(0);
	}

	const { batch } = resolved;
	const slug = options.slug ?? slugForGuideKeyword(batch.primaryKeyword);

	if (!slug) {
		throw new Error('Could not derive slug from keyword');
	}

	mkdirSync(GUIDES_DIR, { recursive: true });
	const outPath = join(GUIDES_DIR, `${slug}.md`);
	if (existsSync(outPath)) {
		throw new Error(`Refusing to overwrite existing guide: ${outPath}`);
	}

	let newsContext: string | undefined;
	if (!options.skipNewsCheck) {
		const news = await resolveGuideNewsContext();
		if (news.mode === 'not_relevant') {
			console.info(
				'[guides:generate] news_not_relevant — no SVT headline matched Skaffu themes; skipping generation'
			);
			process.exit(0);
		}
		if (news.mode === 'rss_unavailable') {
			console.warn(
				'[guides:generate] SVT RSS unavailable — falling back to keyword-matrix-only generation'
			);
		} else if (news.relevance?.item) {
			newsContext = formatNewsContextForPrompt(news.relevance.item, news.relevance.matchedTopics);
			console.info(
				`[guides:generate] news="${news.relevance.item.title.slice(0, 60)}..." topics=${news.relevance.matchedTopics.join(', ')}`
			);
		}
	}

	const today = new Date().toISOString().slice(0, 10);
	const prompt = buildGenerationPrompt({ batch, today, newsContext });

	console.info(`[guides:generate] keyword="${batch.primaryKeyword}" slug=${slug}`);
	const generated = await callOpenAi(prompt, apiKey);
	const parsed = parseGeneratedMarkdown(generated);

	const quality = validateGuideQuality({
		title: parsed.title,
		description: parsed.description,
		body: parsed.body
	});

	if (!quality.ok) {
		console.warn('[guides:generate] checklist FAILED:');
		for (const err of quality.errors) {
			console.warn(`  - ${err}`);
		}
		if (options.publish) {
			console.error('[guides:generate] --publish refused: fix checklist failures first');
			process.exit(2);
		}
		console.warn('[guides:generate] edit the draft manually before publishing.');
	}

	const published = options.publish && quality.ok;
	const fileContent = `${buildFrontmatterBlock({
		title: parsed.title,
		description: parsed.description,
		date: today,
		keywords: parsed.keywords.length > 0 ? parsed.keywords : [batch.primaryKeyword],
		published
	})}\n\n${parsed.body}\n`;

	writeFileSync(outPath, fileContent, 'utf8');

	console.info(`[guides:generate] wrote ${outPath}`);
	console.info(`[guides:generate] wordCount=${quality.wordCount} published=${published}`);
	if (!quality.ok) {
		process.exit(2);
	}

	if (published) {
		console.info('[guides:generate] checklist passed — guide is publish-ready');
	} else {
		console.info('[guides:generate] checklist passed — review content, then set published: true');
	}
}

main().catch((error) => {
	console.error('[guides:generate]', error instanceof Error ? error.message : error);
	process.exit(1);
});
