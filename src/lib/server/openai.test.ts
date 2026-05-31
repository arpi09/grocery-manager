import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: { OPENAI_API_KEY: undefined as string | undefined }
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

import {
	extractResponseOutputText,
	getOpenAiApiKey,
	mapOpenAiFailureStatus,
	missingOpenAiKeyMessage,
	OPENAI_MODEL,
	openAiFailureMessageKey
} from './openai';

describe('getOpenAiApiKey', () => {
	beforeEach(() => {
		mockEnv.OPENAI_API_KEY = undefined;
	});

	it('reads OPENAI_API_KEY from SvelteKit env', () => {
		mockEnv.OPENAI_API_KEY = '  sk-sveltekit  ';
		expect(getOpenAiApiKey()).toBe('sk-sveltekit');
	});

	it('returns null when no key is configured', () => {
		expect(getOpenAiApiKey()).toBeNull();
	});
});

describe('missingOpenAiKeyMessage', () => {
	it('names the feature and env variable', () => {
		expect(missingOpenAiKeyMessage('recipe suggestions')).toContain('OPENAI_API_KEY');
		expect(missingOpenAiKeyMessage('recipe suggestions')).toContain('recipe suggestions');
	});
});

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

describe('openAiFailureMessageKey', () => {
	it('maps auth errors to unauthorized key', () => {
		expect(openAiFailureMessageKey(401)).toBe('errors.api.openAiUnauthorized');
		expect(openAiFailureMessageKey(403)).toBe('errors.api.openAiUnauthorized');
	});

	it('maps rate limit to rate limit key', () => {
		expect(openAiFailureMessageKey(429)).toBe('errors.api.openAiRateLimit');
	});

	it('maps other failures to generic request failed key', () => {
		expect(openAiFailureMessageKey(502)).toBe('errors.api.openAiRequestFailed');
	});
});

describe('OPENAI_MODEL', () => {
	it('uses gpt-4.1-mini for structured Responses API calls', () => {
		expect(OPENAI_MODEL).toBe('gpt-4.1-mini');
	});
});

describe('extractResponseOutputText', () => {
	it('reads output_text when present', () => {
		expect(
			extractResponseOutputText({
				output_text: '{"recipes":[]}'
			})
		).toBe('{"recipes":[]}');
	});

	it('falls back to message output parts', () => {
		expect(
			extractResponseOutputText({
				output: [
					{
						type: 'message',
						content: [{ type: 'output_text', text: '{"recipes":[]}' }]
					}
				]
			})
		).toBe('{"recipes":[]}');
	});
});
