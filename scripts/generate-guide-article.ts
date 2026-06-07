/**
 * AI-assisted SEO guide generator.
 *
 * Usage:
 *   npm run guides:generate -- --keyword 0
 *   npm run guides:generate -- --topic "utgångsdatum kylskåp app"
 *
 * Writes draft to content/guides/sv/{slug}.md with published: false.
 * Review checklist output before setting published: true.
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { GUIDE_KEYWORD_MATRIX } from '../src/lib/marketing/guides.ts';
import { validateGuideQuality } from '../src/lib/marketing/guide-quality.ts';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-4.1-mini';
const GUIDES_DIR = join(process.cwd(), 'content/guides/sv');

interface CliOptions {
	topic?: string;
	keywordIndex?: number;
	slug?: string;
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
		}
	}
	return options;
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

function resolveKeywordBatch(options: CliOptions) {
	if (options.topic) {
		const match = GUIDE_KEYWORD_MATRIX.find(
			(row) =>
				row.topic === options.topic ||
				row.primaryKeyword === options.topic ||
				row.primaryKeyword.includes(options.topic ?? '')
		);
		if (match) {
			return match;
		}
		return {
			topic: options.topic,
			primaryKeyword: options.topic,
			angle: 'Butiksneutralt skafferi med lager som sanningskälla'
		};
	}

	const index = options.keywordIndex ?? 0;
	const row = GUIDE_KEYWORD_MATRIX[index];
	if (!row) {
		throw new Error(`Invalid --keyword index ${index}. Use 0-${GUIDE_KEYWORD_MATRIX.length - 1}.`);
	}
	return row;
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
}): string {
	const keywordLines = input.keywords.map((kw) => `  - ${kw}`).join('\n');
	return `---
title: ${JSON.stringify(input.title)}
description: ${JSON.stringify(input.description)}
date: ${input.date}
keywords:
${keywordLines}
published: false
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

async function main(): Promise<void> {
	const apiKey = process.env.OPENAI_API_KEY?.trim();
	if (!apiKey) {
		console.error('OPENAI_API_KEY is required. Add it to .env or pass via --env-file.');
		process.exit(1);
	}

	const options = parseArgs(process.argv.slice(2));
	const batch = resolveKeywordBatch(options);
	const slug = options.slug ?? slugify(batch.primaryKeyword);

	if (!slug) {
		throw new Error('Could not derive slug from keyword');
	}

	mkdirSync(GUIDES_DIR, { recursive: true });
	const outPath = join(GUIDES_DIR, `${slug}.md`);
	if (existsSync(outPath)) {
		throw new Error(`Refusing to overwrite existing guide: ${outPath}`);
	}

	const today = new Date().toISOString().slice(0, 10);
	const prompt = `Du skriver en SEO-guide på svenska för Skaffu (skafferi-app, skaffu.com).

Primärt sökord: ${batch.primaryKeyword}
Vinkel: ${batch.angle}

Krav:
- Minst 850 ord i brödtexten (markdown efter frontmatter).
- Frontmatter med title, description (120-160 tecken), date (${today}), keywords (3-5), published: false.
- Minst en intern länk till /register, /kvitto-pdf-kivra eller /guider/...
- Länka naturligt till befintliga sidor: /minska-matsvinn, /skafferi-app, /kvitto-pdf-kivra där det passar.
- Skriv ärligt om Skaffu: gratisplan finns, Pro från cirka 39 kr/mån — inga garantier eller "gratis för alltid".
- Nämn att kvitto-AI kräver granskning; inga påhittade butiksintegrationer utöver PDF/Kivra.
- Undvik generiska hälsotips utan koppling till skafferi/lager.
- Svara ENDAST med komplett markdown-fil (frontmatter + artikel), inga kodblock runt hela svaret.

Struktur: H1 i frontmatter title (inte i body), 5-7 H2-sektioner, punktlistor där det hjälper, avsluta med CTA-länk till /register.`;

	console.info(`[guides:generate] keyword="${batch.primaryKeyword}" slug=${slug}`);
	const generated = await callOpenAi(prompt, apiKey);
	const parsed = parseGeneratedMarkdown(generated);

	const quality = validateGuideQuality({
		title: parsed.title,
		description: parsed.description,
		body: parsed.body
	});

	const fileContent = `${buildFrontmatterBlock({
		title: parsed.title,
		description: parsed.description,
		date: today,
		keywords: parsed.keywords.length > 0 ? parsed.keywords : [batch.primaryKeyword]
	})}\n\n${parsed.body}\n`;

	writeFileSync(outPath, fileContent, 'utf8');

	console.info(`[guides:generate] wrote ${outPath}`);
	console.info(`[guides:generate] wordCount=${quality.wordCount} published=false`);
	if (!quality.ok) {
		console.warn('[guides:generate] checklist FAILED:');
		for (const err of quality.errors) {
			console.warn(`  - ${err}`);
		}
		console.warn('[guides:generate] edit the draft manually before publishing.');
		process.exit(2);
	}

	console.info('[guides:generate] checklist passed — review content, then set published: true');
}

main().catch((error) => {
	console.error('[guides:generate]', error instanceof Error ? error.message : error);
	process.exit(1);
});
