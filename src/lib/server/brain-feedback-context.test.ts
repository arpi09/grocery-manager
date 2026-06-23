import { describe, expect, it } from 'vitest';
import {
	buildReplenishmentFeedbackBlock,
	type ReplenishmentFeedbackRow
} from './brain-feedback-context';

describe('brain-feedback-context', () => {
	it('formats replenishment accept and dismiss rows', () => {
		const rows: ReplenishmentFeedbackRow[] = [
			{
				subjectKey: 'mjolk',
				displayName: 'Mjölk',
				feedbackType: 'accepted'
			},
			{
				subjectKey: 'pasta',
				displayName: 'Pasta',
				feedbackType: 'ignored'
			}
		];

		const block = buildReplenishmentFeedbackBlock(rows, 'sv');
		expect(block).toContain('Mjölk');
		expect(block).toContain('accepterade köp-igen');
		expect(block).toContain('avfärdade förslaget');
	});

	it('formats rejected rows in English', () => {
		const block = buildReplenishmentFeedbackBlock(
			[{ subjectKey: 'gradde', displayName: 'Grädde', feedbackType: 'rejected' }],
			'en'
		);
		expect(block).toContain('rejected suggestion');
		expect(block).toContain('Grädde');
	});
});
