export interface BrainScoreInput {
	ruleCount: number;
	feedbackCount: number;
	receiptLineCount: number;
}

export interface BrainScoreSnapshot {
	score: number;
	labelKey: string;
	ruleCount: number;
	feedbackCount: number;
	receiptLineCount: number;
}

export function computeBrainScore(input: BrainScoreInput): number {
	const { ruleCount, feedbackCount, receiptLineCount } = input;
	const raw = ruleCount * 8 + feedbackCount * 3 + Math.min(receiptLineCount, 25) * 2;
	return Math.min(100, Math.round(raw));
}

export function getSnapshot(input: BrainScoreInput): BrainScoreSnapshot {
	const score = computeBrainScore(input);
	let labelKey = 'brain.score.new';
	if (score >= 60) labelKey = 'brain.score.strong';
	else if (score >= 25) labelKey = 'brain.score.growing';

	return {
		score,
		labelKey,
		ruleCount: input.ruleCount,
		feedbackCount: input.feedbackCount,
		receiptLineCount: input.receiptLineCount
	};
}
