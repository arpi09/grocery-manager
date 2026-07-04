import { describe, expect, it } from 'vitest';
import { buildBatchInputJsonl, parseBatchOutputJsonl } from './openai-batch';

describe('buildBatchInputJsonl', () => {
	it('emits one JSONL line per request, targeting /v1/responses', () => {
		const jsonl = buildBatchInputJsonl([
			{ customId: 'missing_expiry:0', body: { model: 'gpt-5.4-nano', input: [] } },
			{ customId: 'missing_expiry:1', body: { model: 'gpt-5.4-nano', input: [] } }
		]);
		const lines = jsonl.split('\n');
		expect(lines).toHaveLength(2);
		const first = JSON.parse(lines[0]);
		expect(first).toMatchObject({
			custom_id: 'missing_expiry:0',
			method: 'POST',
			url: '/v1/responses'
		});
		expect(first.body.model).toBe('gpt-5.4-nano');
	});
});

describe('parseBatchOutputJsonl', () => {
	it('parses strict-JSON output_text into json and keeps custom_id', () => {
		const line = JSON.stringify({
			custom_id: 'missing_expiry:0',
			response: {
				status_code: 200,
				body: { output_text: '{"estimates":[{"index":0,"estimatedDays":7,"confidence":0.6}]}' }
			},
			error: null
		});
		const [parsed] = parseBatchOutputJsonl(line);
		expect(parsed.customId).toBe('missing_expiry:0');
		expect(parsed.statusCode).toBe(200);
		expect(parsed.json).toEqual({ estimates: [{ index: 0, estimatedDays: 7, confidence: 0.6 }] });
		expect(parsed.error).toBeNull();
	});

	it('parses output message parts (no output_text) into text', () => {
		const line = JSON.stringify({
			custom_id: 'admin_digest:0',
			response: {
				status_code: 200,
				body: {
					output: [{ type: 'message', content: [{ type: 'output_text', text: 'Veckan gick bra.' }] }]
				}
			}
		});
		const [parsed] = parseBatchOutputJsonl(line);
		expect(parsed.text).toBe('Veckan gick bra.');
		expect(parsed.json).toBeNull();
	});

	it('surfaces error lines and skips blank/malformed lines', () => {
		const jsonl = [
			'',
			'{ not json',
			JSON.stringify({ custom_id: 'expiry_push:3', error: { message: 'rate limited' } }),
			'   '
		].join('\n');
		const parsed = parseBatchOutputJsonl(jsonl);
		expect(parsed).toHaveLength(1);
		expect(parsed[0].customId).toBe('expiry_push:3');
		expect(parsed[0].error).toEqual({ message: 'rate limited' });
	});
});
