import { describe, expect, it, vi } from 'vitest';
import { expiryPushBodyKey } from '$lib/server/expiry-push-prompt';
import {
	createExpiryPushBatchHandler,
	createPrebatchedPushBodyProvider
} from './expiry-push.handler';
import { createAdminDigestBatchHandler } from './admin-digest.handler';
import type { AiBatchJob } from '$lib/infrastructure/repositories/ai-batch-job.repository';
import type { BatchOutputLine } from '$lib/server/openai-batch';

describe('expiryPushBodyKey', () => {
	it('is stable regardless of item order and day counts', () => {
		const a = expiryPushBodyKey('u1', [
			{ name: 'Mjölk', daysUntil: 2 },
			{ name: 'Ost', daysUntil: 4 }
		]);
		const b = expiryPushBodyKey('u1', [
			{ name: 'ost', daysUntil: 1 },
			{ name: 'MJÖLK', daysUntil: 9 }
		]);
		expect(a).toBe(b);
	});

	it('differs by user and by item set', () => {
		const base = expiryPushBodyKey('u1', [{ name: 'Mjölk', daysUntil: 2 }]);
		expect(base).not.toBe(expiryPushBodyKey('u2', [{ name: 'Mjölk', daysUntil: 2 }]));
		expect(base).not.toBe(expiryPushBodyKey('u1', [{ name: 'Ägg', daysUntil: 2 }]));
	});
});

describe('createExpiryPushBatchHandler', () => {
	// 2026-01-04 is a Sunday (the weekly pre-generation day).
	const sunday = () => new Date(Date.UTC(2026, 0, 4, 16, 30));
	const monday = () => new Date(Date.UTC(2026, 0, 5, 16, 30));

	it('collects one request line per prediction with a keyed payload (Sunday)', async () => {
		const handler = createExpiryPushBatchHandler({
			now: sunday,
			expiryReminderService: {
				collectWeeklyPushPredictions: vi.fn().mockResolvedValue([
					{ userId: 'u1', key: 'u1::mjölk', items: [{ name: 'Mjölk', daysUntil: 2 }] },
					{ userId: 'u2', key: 'u2::ost', items: [{ name: 'Ost', daysUntil: 3 }] }
				])
			}
		});

		const collected = await handler.collect('sk-test');
		expect(collected).not.toBeNull();
		expect(collected!.lines).toHaveLength(2);
		expect(collected!.lines[0].customId).toBe('expiry_push:0');
		expect((collected!.payload as { targets: Record<string, { key: string }> }).targets['expiry_push:0'].key).toBe(
			'u1::mjölk'
		);
	});

	it('skips generation on non-Sunday days', async () => {
		const collect = vi.fn().mockResolvedValue([
			{ userId: 'u1', key: 'u1::mjölk', items: [{ name: 'Mjölk', daysUntil: 2 }] }
		]);
		const handler = createExpiryPushBatchHandler({
			now: monday,
			expiryReminderService: { collectWeeklyPushPredictions: collect }
		});
		expect(await handler.collect('sk-test')).toBeNull();
		expect(collect).not.toHaveBeenCalled();
	});

	it('returns null when there is nothing to generate', async () => {
		const handler = createExpiryPushBatchHandler({
			now: sunday,
			expiryReminderService: { collectWeeklyPushPredictions: vi.fn().mockResolvedValue([]) }
		});
		expect(await handler.collect('sk-test')).toBeNull();
	});

	it('applies output bodies keyed by their target key', async () => {
		const handler = createExpiryPushBatchHandler({
			expiryReminderService: { collectWeeklyPushPredictions: vi.fn() }
		});
		const lines: BatchOutputLine[] = [
			{ customId: 'expiry_push:0', statusCode: 200, json: { body: 'Ät upp mjölken idag!' }, text: '', error: null },
			{ customId: 'expiry_push:1', statusCode: 200, json: { body: '   ' }, text: '', error: null }
		];
		const result = await handler.apply(lines, { targets: { 'expiry_push:0': { key: 'u1::mjölk' } } });
		expect(result.applied).toBe(1);
		expect((result.result as { bodies: Record<string, string> }).bodies).toEqual({
			'u1::mjölk': 'Ät upp mjölken idag!'
		});
	});
});

describe('createPrebatchedPushBodyProvider', () => {
	const key = expiryPushBodyKey('u1', [{ name: 'Mjölk', daysUntil: 2 }]);

	function jobWith(bodies: Record<string, string>): AiBatchJob {
		return {
			id: 'j1',
			kind: 'expiry_push',
			status: 'applied',
			openaiBatchId: null,
			inputFileId: null,
			outputFileId: null,
			requestCount: 1,
			payload: {},
			result: { bodies },
			error: null,
			createdAt: new Date(0),
			updatedAt: new Date(0)
		};
	}

	it('returns a cached body on key match', async () => {
		const provider = createPrebatchedPushBodyProvider({
			listRecentApplied: vi.fn().mockResolvedValue([jobWith({ [key]: 'Cachad text' })])
		});
		expect(await provider.get('u1', [{ name: 'Mjölk', daysUntil: 2 }])).toBe('Cachad text');
	});

	it('returns null on a miss', async () => {
		const provider = createPrebatchedPushBodyProvider({
			listRecentApplied: vi.fn().mockResolvedValue([jobWith({ 'other::key': 'x' })])
		});
		expect(await provider.get('u1', [{ name: 'Mjölk', daysUntil: 2 }])).toBeNull();
	});
});

describe('createAdminDigestBatchHandler', () => {
	it('collects one freeform digest request on Sunday', async () => {
		const handler = createAdminDigestBatchHandler({
			now: () => new Date(Date.UTC(2026, 0, 4, 16, 30)),
			adminInsightsService: {
				buildWeeklyDigestBatchInput: vi
					.fn()
					.mockResolvedValue({ systemPrompt: 'sys', userPrompt: '{"onTarget":"3/5"}' })
			}
		});
		const collected = await handler.collect('sk-test');
		expect(collected!.lines).toHaveLength(1);
		expect(collected!.lines[0].customId).toBe('admin_digest:0');
	});

	it('skips generation on non-Sunday days', async () => {
		const build = vi.fn();
		const handler = createAdminDigestBatchHandler({
			now: () => new Date(Date.UTC(2026, 0, 5, 16, 30)),
			adminInsightsService: { buildWeeklyDigestBatchInput: build }
		});
		expect(await handler.collect('sk-test')).toBeNull();
		expect(build).not.toHaveBeenCalled();
	});

	it('applies the first usable paragraph', async () => {
		const handler = createAdminDigestBatchHandler({
			adminInsightsService: { buildWeeklyDigestBatchInput: vi.fn() }
		});
		const lines: BatchOutputLine[] = [
			{ customId: 'admin_digest:0', statusCode: 200, json: null, text: '  Veckan gick bra.  ', error: null }
		];
		const result = await handler.apply(lines, {});
		expect(result.applied).toBe(1);
		expect((result.result as { paragraph: string }).paragraph).toBe('Veckan gick bra.');
	});
});
