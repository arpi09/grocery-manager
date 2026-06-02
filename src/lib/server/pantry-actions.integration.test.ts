import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdService } from '$lib/application/household.service';
import { DrizzleHouseholdRepository } from '$lib/infrastructure/repositories/household.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { createHouseholdAction, switchHouseholdAction } from '$lib/server/pantry-actions';
import type { RequestEvent } from '@sveltejs/kit';

let integrationDb: IntegrationDbContext;
let householdService: HouseholdService;

vi.mock('$lib/infrastructure/db/init', () => ({
	getDb: () => integrationDb.db
}));

function formRequest(fields: Record<string, string>) {
	const body = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		body.set(key, value);
	}
	return new Request('http://localhost/hem', { method: 'POST', body });
}

function pantryEvent(
	request: Request,
	user: { id: string },
	overrides: Partial<RequestEvent['locals']> = {}
): RequestEvent {
	return {
		request,
		locals: {
			user,
			householdService,
			...overrides
		}
	} as RequestEvent;
}

async function expectRedirectTo(
	promise: Promise<unknown>,
	pathname: string
): Promise<void> {
	await expect(promise).rejects.toMatchObject({
		status: 302,
		location: expect.stringContaining(pathname)
	});
}

describe('Pantry actions (/hem) integration', () => {
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

	it('createHousehold action sets new pantry active and redirects', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			name: 'Hemma',
			members: [{ userId: 'user-1', role: 'owner' }]
		});

		const request = formRequest({ name: 'Stugan', redirectTo: '/inkop' });
		await expectRedirectTo(
			createHouseholdAction(pantryEvent(request, { id: 'user-1' })),
			'/inkop'
		);

		const activeId = await householdService.resolveActiveHouseholdId('user-1');
		const view = await householdService.getHouseholdForUser('user-1');
		expect(view?.name).toBe('Stugan');
		expect(activeId).toBeTruthy();

		const households = await householdService.listHouseholdsForUser('user-1');
		expect(households.find((row) => row.name === 'Stugan')?.isActive).toBe(true);
	});

	it('switchHousehold action changes active pantry and redirects', async () => {
		await integrationDb.seedUser({ id: 'user-1', email: 'user@example.com' });
		await integrationDb.seedHousehold({
			id: 'household-a',
			name: 'Hemma',
			members: [{ userId: 'user-1', role: 'owner' }]
		});
		await integrationDb.seedHousehold({
			id: 'household-b',
			name: 'Stugan',
			members: [{ userId: 'user-1', role: 'editor' }]
		});

		await householdService.switchActiveHousehold('user-1', 'household-a');

		const request = formRequest({
			householdId: 'household-b',
			redirectTo: '/planer'
		});
		await expectRedirectTo(
			switchHouseholdAction(pantryEvent(request, { id: 'user-1' })),
			'/planer'
		);

		const households = await householdService.listHouseholdsForUser('user-1');
		expect(households.find((row) => row.id === 'household-b')?.isActive).toBe(true);
	});
});
