import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePhotoRoundFromImages } from '$lib/server/photo-round-parse';

function openAiPayload(items: unknown[], detectedZone = 'fridge', zoneConfidence = 'high') {
	return {
		output_text: JSON.stringify({ detectedZone, zoneConfidence, items })
	};
}

function mockFetch(...responses: Array<{ ok: boolean; status?: number; body?: unknown; text?: string }>) {
	let call = 0;
	return vi.fn(async (_url: string, init?: RequestInit) => {
		const next = responses[call++] ?? responses[responses.length - 1];
		if (call === 2 && init?.body) {
			const payload = JSON.parse(String(init.body)) as {
				input?: Array<{ role: string; content?: unknown[] }>;
			};
			const userContent = payload.input?.find((entry) => entry.role === 'user')?.content ?? [];
			const imageParts = userContent.filter(
				(part) => part && typeof part === 'object' && (part as { type?: string }).type === 'input_image'
			);
			expect(imageParts.length).toBeGreaterThan(0);
			for (const part of imageParts) {
				expect((part as { detail?: string }).detail).toBe('high');
			}
		}
		return {
			ok: next.ok,
			status: next.status ?? (next.ok ? 200 : 502),
			json: async () => next.body,
			text: async () => next.text ?? ''
		};
	});
}

const FULL_ITEM = {
	name: 'Mjölk',
	quantity: '1',
	unit: 'l',
	confidence: 'high',
	location: 'fridge',
	expiresOn: '2026-06-15',
	notes: 'Arla 3%'
};

describe('parsePhotoRoundFromImages integration (mocked OpenAI)', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns parsed fridge items with detected zone from single vision call when all items high confidence', async () => {
		const items = [FULL_ITEM];
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
					location: 'fridge',
					expiresOn: '2026-06-15',
					notes: 'Arla 3%'
				}
			],
			detectedZone: 'fridge',
			zoneConfidence: 'high'
		});
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
	});

	it('honours zone hint with forced high confidence', async () => {
		const items = [FULL_ITEM];
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
					location: 'fridge',
					expiresOn: '2026-06-15',
					notes: 'Arla 3%'
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

	it('skips validation when validate is false', async () => {
		const items = [FULL_ITEM];
		vi.stubGlobal('fetch', mockFetch({ ok: true, body: openAiPayload(items) }));

		await parsePhotoRoundFromImages('sk-test', 'fridge', ['data:image/jpeg;base64,/9j/4AAQ'], {
			validate: false
		});

		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
	});
});
