/**
 * AI-assisted SEO guide generator.
 *
 * Usage:
 *   npm run guides:generate -- --keyword 0
 *   npm run guides:generate -- --topic "utgångsdatum kylskåp app"
 *   npm run guides:publish-next   # --next --publish
 *   npm run guides:generate -- --next --skip-news-check   # bypass SVT gate (local)
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { GUIDE_KEYWORD_MATRIX, slugForGuideKeyword } from '../src/lib/marketing/guides.ts';
import { resolveNextGuideKeywordIndex } from '../src/lib/marketing/guides.server.ts';
import { generateGuideContent } from '../src/lib/marketing/generate-guide-article.server.ts';
import { validateGuideQuality } from '../src/lib/marketing/guide-quality.ts';

const GUIDES_DIR = join(process.cwd(), 'content/guides/sv');

interface CliOptions {
	topic?: string;
	keywordIndex?: number;
	slug?: string;
	next?: boolean;
	publish?: boolean;
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

	const generated = await generateGuideContent(apiKey, {
		skipNewsCheck: options.skipNewsCheck,
		batch: options.next ? undefined : batch,
		slug
	});

	if (!generated.ok) {
		if (generated.error === 'queue_empty') {
			console.info('[guides:generate] queue_empty — all keyword-matrix guides already exist');
			process.exit(0);
		}
		console.error('[guides:generate]', generated.error, generated.detail ?? '');
		process.exit(1);
	}

	const parsed = {
		title: generated.content.title,
		description: generated.content.description,
		keywords: generated.content.keywords,
		body: generated.content.body
	};

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
		date: generated.content.articleDate,
		keywords: parsed.keywords,
		published
	})}\n\n${parsed.body}\n`;

	writeFileSync(outPath, fileContent, 'utf8');

	console.info(`[guides:generate] keyword="${batch.primaryKeyword}" slug=${slug}`);
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
