import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdService } from '$lib/application/household.service';
import { SHARE_INVITE_EMAIL } from '$lib/domain/household';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { POST } from './+server';

describe('POST /api/household/share-invite', () => {
	let integrationDb: IntegrationDbContext;
	let householdService: HouseholdService;
	const householdId = 'share-invite-api-test';

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		householdService = new HouseholdService(new DrizzleHouseholdRepository(integrationDb.db));
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	async function seedOwner() {
		await integrationDb.seedUser({ id: 'owner-1', email: 'owner@example.com' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Share invite API household',
			members: [{ userId: 'owner-1', role: 'owner' }]
		});
	}

	async function seedEditor() {
		await integrationDb.seedUser({ id: 'owner-1', email: 'owner@example.com' });
		await integrationDb.seedUser({ id: 'editor-1', email: 'editor@example.com' });
		await integrationDb.seedHousehold({
			id: householdId,
			name: 'Share invite API household',
			members: [
				{ userId: 'owner-1', role: 'owner' },
				{ userId: 'editor-1', role: 'editor' }
			]
		});
	}

	function makeRequest(context = 'inkop') {
		return new Request('http://localhost/api/household/share-invite', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ context })
		});
	}

	function makeLocals(
		overrides: Partial<App.Locals> & {
			user?: App.Locals['user'];
			householdId?: string | null;
			householdRole?: App.Locals['householdRole'];
		} = {}
	): App.Locals {
		return {
			locale: 'en',
			householdService,
			pmfService: { recordEvent: vi.fn().mockResolvedValue(undefined) },
			...overrides
		} as App.Locals;
	}

	it('returns 401 when unauthenticated', async () => {
		const response = await POST({
			request: makeRequest(),
			locals: makeLocals({ user: null, householdId: null }),
			url: new URL('http://localhost/api/household/share-invite')
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(401);
	});

	it('returns 403 when user is not household owner', async () => {
		await seedEditor();

		const response = await POST({
			request: makeRequest(),
			locals: makeLocals({
				user: { id: 'editor-1', email: 'editor@example.com' } as App.Locals['user'],
				householdId,
				householdRole: 'editor'
			}),
			url: new URL('http://localhost/api/household/share-invite')
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.ok).toBe(false);
	});

	it('returns invite URL for owner and reuses pending share invite', async () => {
		await seedOwner();

		const locals = makeLocals({
			user: { id: 'owner-1', email: 'owner@example.com' } as App.Locals['user'],
			householdId,
			householdRole: 'owner'
		});

		const first = await POST({
			request: makeRequest(),
			locals,
			url: new URL('http://localhost/api/household/share-invite')
		} as Parameters<typeof POST>[0]);
		const second = await POST({
			request: makeRequest(),
			locals,
			url: new URL('http://localhost/api/household/share-invite')
		} as Parameters<typeof POST>[0]);

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);

		const firstBody = await first.json();
		const secondBody = await second.json();
		expect(firstBody.ok).toBe(true);
		expect(secondBody.ok).toBe(true);
		expect(firstBody.inviteUrl).toMatch(/\/invite\//);
		expect(secondBody.inviteUrl).toBe(firstBody.inviteUrl);

		const pending = await householdService.listPendingInvites(householdId, 'owner-1');
		const shareInvite = pending.find((row) => row.email === SHARE_INVITE_EMAIL);
		expect(shareInvite?.role).toBe('editor');
	});

	it('records household_invite_created with export_prompt context', async () => {
		await seedOwner();

		const recordEvent = vi.fn().mockResolvedValue(undefined);
		const locals = makeLocals({
			user: { id: 'owner-1', email: 'owner@example.com' } as App.Locals['user'],
			householdId,
			householdRole: 'owner',
			pmfService: { recordEvent } as unknown as App.Locals['pmfService']
		});

		const response = await POST({
			request: makeRequest('export_prompt'),
			locals,
			url: new URL('http://localhost/api/household/share-invite')
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(recordEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: 'household_invite_created',
				metadata: { context: 'export_prompt' }
			})
		);
	});

	it('records household_invite_created with request context', async () => {
		await seedOwner();

		const recordEvent = vi.fn().mockResolvedValue(undefined);
		const locals = makeLocals({
			user: { id: 'owner-1', email: 'owner@example.com' } as App.Locals['user'],
			householdId,
			householdRole: 'owner',
			pmfService: { recordEvent } as unknown as App.Locals['pmfService']
		});

		const response = await POST({
			request: makeRequest('lista'),
			locals,
			url: new URL('http://localhost/api/household/share-invite')
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(recordEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				eventType: 'household_invite_created',
				metadata: { context: 'lista' }
			})
		);
	});
});
