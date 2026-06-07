import { describe, expect, it } from 'vitest';
import { aiServiceErrorMessage } from './ai-service-error';

describe('aiServiceErrorMessage', () => {
	it('prefers server error text', () => {
		expect(aiServiceErrorMessage(502, 'Custom AI down')).toBe('Custom AI down');
	});

	it('maps 503 to service unavailable copy', () => {
		expect(aiServiceErrorMessage(503)).toContain('AI');
	});

	it('uses weekly ritual fallback key', () => {
		expect(aiServiceErrorMessage(500, null, 'weeklyRitual.generateFailed')).toContain('förslag');
	});
});
