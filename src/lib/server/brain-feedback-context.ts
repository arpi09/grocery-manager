import type { LearningFeedbackType } from '$lib/infrastructure/repositories/learning-feedback.repository';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';
import { normalizePromptLocale } from '$lib/server/ai-prompt-shared';

const REPLENISHMENT_FEEDBACK_LIMIT = 10;

export type ReplenishmentFeedbackType = Extract<LearningFeedbackType, 'accepted' | 'rejected' | 'ignored'>;

export interface ReplenishmentFeedbackRow {
	subjectKey: string;
	displayName: string;
	feedbackType: ReplenishmentFeedbackType;
}

function readDisplayName(contextJson: Record<string, unknown>, subjectKey: string): string {
	const name = contextJson.displayName ?? contextJson.productName;
	return typeof name === 'string' && name.trim() ? name.trim() : subjectKey;
}

export async function loadReplenishmentFeedback(
	repository: ILearningFeedbackRepository,
	householdId: string
): Promise<ReplenishmentFeedbackRow[]> {
	const rows = await repository.listByHouseholdAndPredictor(householdId, 'replenishment', {
		limit: REPLENISHMENT_FEEDBACK_LIMIT * 2
	});

	const feedback: ReplenishmentFeedbackRow[] = [];
	for (const row of rows) {
		if (row.feedbackType !== 'accepted' && row.feedbackType !== 'rejected' && row.feedbackType !== 'ignored') {
			continue;
		}
		feedback.push({
			subjectKey: row.subjectKey,
			displayName: readDisplayName(row.contextJson, row.subjectKey),
			feedbackType: row.feedbackType
		});
		if (feedback.length >= REPLENISHMENT_FEEDBACK_LIMIT) break;
	}
	return feedback;
}

export function buildReplenishmentFeedbackBlock(
	rows: ReplenishmentFeedbackRow[],
	locale = 'sv'
): string {
	if (rows.length === 0) return '';

	const promptLocale = normalizePromptLocale(locale);
	const header =
		promptLocale === 'en'
			? 'Recent buy-again feedback in this household (respect when ranking or suggesting):'
			: 'Senaste köp-igen-feedback i hushållet (respektera vid rankning och förslag):';

	const lines = rows.map((row) => {
		if (promptLocale === 'en') {
			if (row.feedbackType === 'accepted') {
				return `- ${row.displayName} (${row.subjectKey}): user accepted buy-again`;
			}
			if (row.feedbackType === 'ignored') {
				return `- ${row.displayName} (${row.subjectKey}): user dismissed suggestion`;
			}
			return `- ${row.displayName} (${row.subjectKey}): user rejected suggestion`;
		}
		if (row.feedbackType === 'accepted') {
			return `- ${row.displayName} (${row.subjectKey}): användaren accepterade köp-igen`;
		}
		if (row.feedbackType === 'ignored') {
			return `- ${row.displayName} (${row.subjectKey}): användaren avfärdade förslaget`;
		}
		return `- ${row.displayName} (${row.subjectKey}): användaren avvisade förslaget`;
	});

	return [header, ...lines].join('\n');
}

export async function loadReplenishmentFeedbackBlock(
	repository: ILearningFeedbackRepository,
	householdId: string,
	locale = 'sv'
): Promise<string> {
	const rows = await loadReplenishmentFeedback(repository, householdId);
	return buildReplenishmentFeedbackBlock(rows, locale);
}
