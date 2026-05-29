import { describe, expect, it } from 'vitest';
import { mapOpenAiFailureStatus, openAiFailureMessage } from './openai';

describe('mapOpenAiFailureStatus', () => {
	it('maps auth and rate-limit errors to 503', () => {
		expect(mapOpenAiFailureStatus(401)).toBe(503);
		expect(mapOpenAiFailureStatus(403)).toBe(503);
		expect(mapOpenAiFailureStatus(429)).toBe(503);
	});

	it('maps other upstream errors to 502', () => {
		expect(mapOpenAiFailureStatus(400)).toBe(502);
		expect(mapOpenAiFailureStatus(500)).toBe(502);
	});
});

describe('openAiFailureMessage', () => {
	it('explains invalid API key without leaking secret details', () => {
		const message = openAiFailureMessage(401, '{"error":"invalid_api_key"}');
		expect(message).toContain('OPENAI_API_KEY');
		expect(message).not.toContain('sk-');
	});
});
