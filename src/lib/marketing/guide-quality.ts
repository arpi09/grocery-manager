/** Quality gates for AI-generated and manually authored SEO guides. */

export const GUIDE_MIN_WORD_COUNT = 800;

export const GUIDE_INTERNAL_LINK_PATTERNS = [
	/\/register\b/,
	/\/kvitto-pdf-kivra\b/,
	/\/guider\/[a-z0-9-]+/
] as const;

/** Phrases that suggest hallucinated pricing or guarantees — reject in generated drafts. */
export const GUIDE_FORBIDDEN_PHRASES = [
	'100% garanti',
	'garanterat gratis för alltid',
	'alltid gratis',
	'ingen kostnad någonsin',
	'0 kr för alltid',
	'livstids gratis',
	'gratis för alltid utan begränsning'
] as const;

export interface GuideQualityInput {
	title: string;
	description: string;
	body: string;
}

export interface GuideQualityResult {
	ok: boolean;
	wordCount: number;
	errors: string[];
}

export function countGuideWords(text: string): number {
	const stripped = text
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/[#*_>`~-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (!stripped) {
		return 0;
	}
	return stripped.split(' ').filter(Boolean).length;
}

export function validateGuideQuality(input: GuideQualityInput): GuideQualityResult {
	const errors: string[] = [];
	const wordCount = countGuideWords(input.body);

	if (!input.title.trim()) {
		errors.push('title is required');
	}
	if (!input.description.trim()) {
		errors.push('description is required');
	}
	if (input.description.trim().length < 50) {
		errors.push('description should be at least 50 characters');
	}
	if (wordCount < GUIDE_MIN_WORD_COUNT) {
		errors.push(`body needs at least ${GUIDE_MIN_WORD_COUNT} words (got ${wordCount})`);
	}

	const linkHaystack = `${input.body}\n${input.title}\n${input.description}`;
	const hasInternalLink = GUIDE_INTERNAL_LINK_PATTERNS.some((pattern) => pattern.test(linkHaystack));
	if (!hasInternalLink) {
		errors.push('body must link to /register, /kvitto-pdf-kivra, or another /guider/ article');
	}

	const lower = linkHaystack.toLowerCase();
	for (const phrase of GUIDE_FORBIDDEN_PHRASES) {
		if (lower.includes(phrase)) {
			errors.push(`forbidden phrase: "${phrase}"`);
		}
	}

	return { ok: errors.length === 0, wordCount, errors };
}
