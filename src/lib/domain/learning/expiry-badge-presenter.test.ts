import { describe, expect, it } from 'vitest';
import { presentExpiryBadge } from './expiry-badge-presenter';

describe('presentExpiryBadge', () => {
	it('uses confidenceSure for high household_learned', () => {
		const result = presentExpiryBadge({ source: 'household_learned', confidence: 0.9 });
		expect(result.labelKey).toBe('learning.confidenceSure');
		expect(result.lowConfidence).toBe(false);
		expect(result.color).toBe('#2d6a4f');
	});

	it('uses lowConfidence label when tier is low', () => {
		const result = presentExpiryBadge({ source: 'ai_inferred', confidence: 0.3 });
		expect(result.labelKey).toBe('learning.lowConfidence');
		expect(result.lowConfidence).toBe(true);
		expect(result.tone).toBe('warning');
	});

	it('maps receipt_printed to sourceReceipt hint', () => {
		expect(presentExpiryBadge({ source: 'receipt_printed' }).sourceHintKey).toBe(
			'learning.sourceReceipt'
		);
	});

	it('assigns purple tone color for ai_inferred', () => {
		expect(presentExpiryBadge({ source: 'ai_inferred', confidence: 0.6 }).color).toBe('#6b4c9a');
	});
});
