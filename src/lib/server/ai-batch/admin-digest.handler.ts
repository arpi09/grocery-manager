import { batchCustomId } from '$lib/domain/ai-batch';
import type { AdminInsightsService } from '$lib/application/admin-insights.service';
import { buildFreeformRequestBody, OPENAI_MODEL } from '$lib/server/openai';
import type { BatchOutputLine } from '$lib/server/openai-batch';
import type { AiBatchApplyResult, AiBatchCollectResult, AiBatchKindHandler } from './types';
import { isUsableOutputLine } from './types';

interface AdminDigestResult {
	paragraph: string;
}

/**
 * Pre-generate only on Sunday (UTC), the day before the weekly PMF-digest cron
 * (Monday 08:00 UTC, pmf-weekly-cron.yml). Daily generation would cost more than
 * the synchronous weekly status quo.
 */
const WEEKLY_PREGEN_UTC_DAY = 0;

/**
 * Pre-generates the weekly owner PMF-digest paragraph via Batch API. The weekly
 * pmf-digest cron reads it prebatched-first (AdminInsightsService), falling back
 * to synchronous generation when no recent batch result exists.
 */
export function createAdminDigestBatchHandler(deps: {
	adminInsightsService: Pick<AdminInsightsService, 'buildWeeklyDigestBatchInput'>;
	now?: () => Date;
}): AiBatchKindHandler {
	return {
		kind: 'admin_digest',
		minResubmitHours: 18,

		isEnabled: () => true,

		async collect(): Promise<AiBatchCollectResult | null> {
			const now = deps.now?.() ?? new Date();
			if (now.getUTCDay() !== WEEKLY_PREGEN_UTC_DAY) return null;

			const input = await deps.adminInsightsService.buildWeeklyDigestBatchInput();
			const customId = batchCustomId('admin_digest', 0);
			return {
				lines: [
					{
						customId,
						body: buildFreeformRequestBody({
							model: OPENAI_MODEL,
							systemPrompt: input.systemPrompt,
							userPrompt: input.userPrompt
						})
					}
				],
				payload: {}
			};
		},

		async apply(lines: BatchOutputLine[]): Promise<AiBatchApplyResult> {
			for (const line of lines) {
				if (!isUsableOutputLine(line)) continue;
				const paragraph = line.text.trim();
				if (!paragraph) continue;
				const result: AdminDigestResult = { paragraph };
				return { applied: 1, result: result as unknown as Record<string, unknown> };
			}
			return { applied: 0, result: null };
		}
	};
}
