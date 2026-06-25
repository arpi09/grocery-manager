import { describe, expect, it } from 'vitest';
import {
	needsShelfLifeLlmRefinement,
	SHELF_LIFE_LLM_REFINEMENT_THRESHOLD
} from '$lib/domain/shelf-life-confidence';
import {
	PROMPT_VERSION_SHELF_LIFE_BATCH,
	SHELF_LIFE_CATEGORY_ANCHORS
} from '$lib/server/ai-prompt-shared';
import { RECEIPT_BBF_FEW_SHOT_BLOCK } from '$lib/server/receipt-bbf-few-shot';
import { SHELF_LIFE_BATCH_SYSTEM_PROMPT } from '$lib/server/receipt-shelf-life-predictions';

describe('shelf-life prompt golden', () => {
	it('uses shelf-life-batch-v5 with expanded anchors and few-shot', () => {
		expect(PROMPT_VERSION_SHELF_LIFE_BATCH).toBe('shelf-life-batch-v5');
		expect(SHELF_LIFE_BATCH_SYSTEM_PROMPT).toContain(PROMPT_VERSION_SHELF_LIFE_BATCH);
		expect(SHELF_LIFE_CATEGORY_ANCHORS).toContain('glass frys');
		expect(SHELF_LIFE_BATCH_SYSTEM_PROMPT).toContain(RECEIPT_BBF_FEW_SHOT_BLOCK);
		expect(SHELF_LIFE_BATCH_SYSTEM_PROMPT).toContain('Homogenisera inte');
	});

	it('needsShelfLifeLlmRefinement flags default_heuristic and low confidence', () => {
		expect(
			needsShelfLifeLlmRefinement({ expiresOnSource: 'default_heuristic', confidence: 0.9 })
		).toBe(true);
		expect(
			needsShelfLifeLlmRefinement({
				expiresOnSource: 'household_learned',
				confidence: SHELF_LIFE_LLM_REFINEMENT_THRESHOLD - 0.1
			})
		).toBe(true);
		expect(
			needsShelfLifeLlmRefinement({
				expiresOnSource: 'household_learned',
				confidence: 0.85
			})
		).toBe(false);
	});
});
