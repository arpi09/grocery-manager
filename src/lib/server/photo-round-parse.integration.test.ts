import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePhotoRoundFromImages } from '$lib/server/photo-round-parse';

function openAiPayload(items: unknown[], detectedZone = 'fridge', zoneConfidence = 'high') {
	return {
		output_text: JSON.stringify({ detectedZone, zoneConfidence, items })
	};
}

function mockFetch(...responses: Array<{ ok: boolean; status?: number; body?: unknown; text?: string }>) {
	let call = 0;
	return vi.fn(async () => {
		const next = responses[call++] ?? responses[responses.length - 1];
		return {
			ok: next.ok,
			status: next.status ?? (next.ok ? 200 : 502),
			json: async () => next.body,
			text: async () => next.text ?? ''
		};
	});
}

describe('parsePhotoRoundFromImages integration (mocked OpenAI)', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns parsed fridge items with detected zone from vision + validation calls', async () => {
		const items = [
			{ name: 'Mjölk', quantity: '1', unit: 'l', confidence: 'high', location: 'fridge' }
		];
		vi.stubGlobal(
			'fetch',
			mockFetch({ ok: true, body: openAiPayload(items) }, { ok: true, body: openAiPayload(items) })
		);

		const result = await parsePhotoRoundFromImages('sk-test', null, ['data:image/jpeg;base64,/9j/4AAQ']);

		expect(result).toEqual({
			ok: true,
			items: [
				{
					name: 'Mjölk',
					quantity: '1',
					unit: 'l',
					confidence: 'high',
					location: 'fridge'
				}
			],
			detectedZone: 'fridge',
			zoneConfidence: 'high'
		});
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
	});

	it('honours zone hint with forced high confidence', async () => {
		const items = [
			{ name: 'Mjölk', quantity: '1', unit: 'l', confidence: 'high', location: 'fridge' }
		];
		vi.stubGlobal('fetch', mockFetch({ ok: true, body: openAiPayload(items, 'cupboard', 'low') }));

		const result = await parsePhotoRoundFromImages('sk-test', 'fridge', [
			'data:image/jpeg;base64,/9j/4AAQ'
		]);

		expect(result).toEqual({
			ok: true,
			items: [
				{
					name: 'Mjölk',
					quantity: '1',
					unit: 'l',
					confidence: 'high',
					location: 'fridge'
				}
			],
			detectedZone: 'fridge',
			zoneConfidence: 'high'
		});
	});

	it('maps OpenAI auth failure to unauthorized message key', async () => {
		vi.stubGlobal('fetch', mockFetch({ ok: false, status: 401, text: 'invalid_api_key' }));

		const result = await parsePhotoRoundFromImages('sk-bad', 'fridge', [
			'data:image/jpeg;base64,/9j/4AAQ'
		]);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe(503);
			expect(result.messageKey).toBe('errors.api.openAiUnauthorized');
		}
	});

	it('returns empty list when model finds no items', async () => {
		vi.stubGlobal('fetch', mockFetch({ ok: true, body: openAiPayload([]) }));

		const result = await parsePhotoRoundFromImages('sk-test', 'cupboard', [
			'data:image/jpeg;base64,/9j/4AAQ'
		]);

		expect(result).toEqual({
			ok: true,
			items: [],
			detectedZone: 'cupboard',
			zoneConfidence: 'high'
		});
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
	});
});
