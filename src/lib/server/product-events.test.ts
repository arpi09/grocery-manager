import { describe, expect, it, vi } from 'vitest';
import { PmfService } from '$lib/application/pmf.service';
import type { ProductEventType } from '$lib/domain/pmf';
import type { IPmfRepository } from '$lib/infrastructure/repositories/pmf.repository';
import { COOKIE_CONSENT_NAME } from '$lib/cookie-consent';
import { POST as postProductEvent } from '../../routes/api/product-events/+server';
import { recordProductEvent } from './product-events';

const DUO_WEDGE_EVENT_TYPES = [
	'list_link_shared',
	'list_link_opened',
	'list_join_cta_clicked',
	'partner_joined',
	'shared_checkoff'
] as const satisfies readonly ProductEventType[];

const DUO_WEDGE_PUBLIC_EVENT_TYPES = ['list_link_opened', 'list_join_cta_clicked'] as const;
const DUO_WEDGE_AUTH_EVENT_TYPES = ['list_link_shared', 'partner_joined', 'shared_checkoff'] as const;

function mockPmfRepository(overrides: Partial<IPmfRepository> = {}): IPmfRepository {
	return {
		recordEvent: vi.fn(),
		getGlobalMetrics: vi.fn(),
		getFunnelMetrics: vi.fn(),
		getLaunchCohortSignups: vi.fn(),
		hasHouseholdEvent: vi.fn(),
		countHouseholdEventsSince: vi.fn(),
		countUserScanEvents: vi.fn(),
		getUserCreatedAt: vi.fn(),
		listRecentHouseholdSyncEvents: vi.fn().mockResolvedValue([]),
		getSyncFunnelCounts: vi.fn(),
		countDistinctHouseholdsWithEventSince: vi.fn(),
		...overrides
	};
}

function createCookieJar(initial: Record<string, string> = {}) {
	const jar = new Map(Object.entries(initial));
	return {
		get: (name: string) => jar.get(name),
		set: vi.fn((name: string, value: string) => {
			jar.set(name, value);
		}),
		delete: vi.fn((name: string) => {
			jar.delete(name);
		})
	};
}

function createProductEventRequest(
	eventType: ProductEventType,
	options: {
		user?: { id: string } | null;
		householdId?: string | null;
		metadata?: Record<string, unknown>;
		consent?: 'all' | 'essential';
		repository?: IPmfRepository;
	} = {}
) {
	const repository =
		options.repository ??
		mockPmfRepository({
			recordEvent: vi.fn().mockResolvedValue(undefined)
		});

	return {
		request: new Request('http://localhost/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eventType,
				metadata: options.metadata ?? { acquisition_source: 'shopping_share' }
			})
		}),
		locals: {
			locale: 'en' as const,
			user: options.user ?? null,
			householdId: options.householdId ?? null,
			pmfService: new PmfService(repository)
		},
		cookies: createCookieJar(
			options.consent ? { [COOKIE_CONSENT_NAME]: options.consent } : {}
		),
		repository
	};
}

describe('recordProductEvent', () => {
	it('delegates to pmf service without blocking', async () => {
		const repository = mockPmfRepository({
			recordEvent: vi.fn().mockResolvedValue(undefined)
		});
		const service = new PmfService(repository);

		recordProductEvent(service, {
			userId: 'user-1',
			householdId: 'house-1',
			eventType: 'scan_completed'
		});

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledWith({
			userId: 'user-1',
			householdId: 'house-1',
			eventType: 'scan_completed'
		});
	});

	it('swallows repository errors', async () => {
		const repository = mockPmfRepository({
			recordEvent: vi.fn().mockRejectedValue(new Error('db down'))
		});
		const service = new PmfService(repository);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		recordProductEvent(service, {
			userId: 'user-1',
			householdId: null,
			eventType: 'receipt_parsed'
		});

		await Promise.resolve();

		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});

	it.each(DUO_WEDGE_EVENT_TYPES)('delegates duo wedge event %s to pmf service', async (eventType) => {
		const repository = mockPmfRepository({
			recordEvent: vi.fn().mockResolvedValue(undefined)
		});
		const service = new PmfService(repository);

		recordProductEvent(service, {
			userId: 'user-wedge',
			householdId: 'house-wedge',
			eventType,
			metadata: { context: 'lista' }
		});

		await Promise.resolve();

		expect(repository.recordEvent).toHaveBeenCalledWith({
			userId: 'user-wedge',
			householdId: 'house-wedge',
			eventType,
			metadata: { context: 'lista' }
		});
	});
});

describe('POST /api/product-events duo wedge allowlist', () => {
	it.each(DUO_WEDGE_PUBLIC_EVENT_TYPES)(
		'accepts public duo wedge event %s when analytics consent is granted',
		async (eventType) => {
			const { request, locals, cookies, repository } = createProductEventRequest(eventType, {
				consent: 'all'
			});

			const response = await postProductEvent({
				request,
				locals,
				cookies
			} as unknown as Parameters<typeof postProductEvent>[0]);

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true });
			expect(repository.recordEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: null,
					eventType
				})
			);
		}
	);

	it.each(DUO_WEDGE_AUTH_EVENT_TYPES)(
		'accepts authenticated duo wedge event %s',
		async (eventType) => {
			const { request, locals, cookies, repository } = createProductEventRequest(eventType, {
				user: { id: 'user-auth' },
				householdId: 'house-auth'
			});

			const response = await postProductEvent({
				request,
				locals,
				cookies
			} as unknown as Parameters<typeof postProductEvent>[0]);

			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true });
			expect(repository.recordEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: 'user-auth',
					householdId: 'house-auth',
					eventType
				})
			);
		}
	);

	it.each(DUO_WEDGE_AUTH_EVENT_TYPES)(
		'rejects unauthenticated duo wedge event %s',
		async (eventType) => {
			const { request, locals, cookies, repository } = createProductEventRequest(eventType);

			const response = await postProductEvent({
				request,
				locals,
				cookies
			} as unknown as Parameters<typeof postProductEvent>[0]);

			expect(response.status).toBe(401);
			expect(repository.recordEvent).not.toHaveBeenCalled();
		}
	);

	it('skips public duo wedge events without analytics consent', async () => {
		const { request, locals, cookies, repository } = createProductEventRequest('list_link_opened');

		const response = await postProductEvent({
			request,
			locals,
			cookies
		} as unknown as Parameters<typeof postProductEvent>[0]);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true, skipped: true });
		expect(repository.recordEvent).not.toHaveBeenCalled();
	});
});
