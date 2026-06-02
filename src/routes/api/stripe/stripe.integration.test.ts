import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDatabase } from '$lib/infrastructure/db';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

const { dbState, testEnv, stripeMocks } = vi.hoisted(() => ({
	dbState: { db: null as AppDatabase | null },
	testEnv: {
		STRIPE_SECRET_KEY: undefined as string | undefined,
		STRIPE_WEBHOOK_SECRET: undefined as string | undefined,
		STRIPE_PRICE_ID_MONTHLY: undefined as string | undefined,
		STRIPE_PRICE_ID_YEARLY: undefined as string | undefined,
		ORIGIN: 'http://localhost:5173',
		PUBLIC_ORIGIN: 'http://localhost:5173'
	},
	stripeMocks: {
		customersCreate: vi.fn(),
		checkoutSessionsCreate: vi.fn(),
		subscriptionsRetrieve: vi.fn(),
		webhooksConstructEvent: vi.fn()
	}
}));

vi.mock('$lib/infrastructure/db', () => ({
	db: new Proxy({} as AppDatabase, {
		get(_target, prop) {
			if (!dbState.db) {
				throw new Error('Integration db not initialized');
			}
			return Reflect.get(dbState.db, prop);
		}
	}),
	getDb: () => {
		if (!dbState.db) {
			throw new Error('Integration db not initialized');
		}
		return dbState.db;
	},
	initDatabase: vi.fn(),
	getDatabaseBackend: () => 'pglite' as const
}));

vi.mock('$env/dynamic/private', () => ({
	env: testEnv
}));

vi.mock('stripe', () => {
	class StripeMock {
		customers = { create: stripeMocks.customersCreate };
		checkout = { sessions: { create: stripeMocks.checkoutSessionsCreate } };
		subscriptions = { retrieve: stripeMocks.subscriptionsRetrieve };
		webhooks = { constructEvent: stripeMocks.webhooksConstructEvent };
	}

	return { default: StripeMock };
});

const HOUSEHOLD_ID = 'hh-stripe-test';
const USER_ID = 'user-stripe-test';

describe('Stripe API integration', () => {
	let integrationDb: IntegrationDbContext;
	let billingService: import('$lib/application/billing.service').BillingService;
	let checkout: typeof import('./checkout/+server').POST;
	let webhook: typeof import('./webhook/+server').POST;
	let locals: App.Locals;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;

		const [{ BillingService }, { DrizzleBillingRepository }, checkoutMod, webhookMod] =
			await Promise.all([
				import('$lib/application/billing.service'),
				import('$lib/infrastructure/repositories/billing.repository'),
				import('./checkout/+server'),
				import('./webhook/+server')
			]);

		billingService = new BillingService(new DrizzleBillingRepository(integrationDb.db));
		checkout = checkoutMod.POST;
		webhook = webhookMod.POST;
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
		await integrationDb.seedUser({ id: USER_ID, email: 'owner@example.com' });
		await integrationDb.seedHousehold({
			id: HOUSEHOLD_ID,
			members: [{ userId: USER_ID, role: 'owner' }]
		});

		testEnv.STRIPE_SECRET_KEY = undefined;
		testEnv.STRIPE_WEBHOOK_SECRET = undefined;
		testEnv.STRIPE_PRICE_ID_MONTHLY = undefined;
		testEnv.STRIPE_PRICE_ID_YEARLY = undefined;
		stripeMocks.customersCreate.mockReset();
		stripeMocks.checkoutSessionsCreate.mockReset();
		stripeMocks.subscriptionsRetrieve.mockReset();
		stripeMocks.webhooksConstructEvent.mockReset();

		locals = {
			user: { id: USER_ID, email: 'owner@example.com' } as App.Locals['user'],
			householdId: HOUSEHOLD_ID,
			householdRole: 'owner',
			planTier: 'free',
			locale: 'sv',
			billingService
		} as App.Locals;
	});

	afterAll(async () => {
		dbState.db = null;
		await integrationDb.close();
	});

	it('checkout returns 503 when Stripe is not configured', async () => {
		const response = await checkout({
			request: new Request('http://localhost/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ interval: 'month' })
			}),
			locals,
			url: new URL('http://localhost:5173/api/stripe/checkout')
		} as Parameters<typeof checkout>[0]);

		expect(response.status).toBe(503);
	});

	it('creates checkout session and stores stripe customer id', async () => {
		testEnv.STRIPE_SECRET_KEY = 'sk_test_integration';
		testEnv.STRIPE_PRICE_ID_MONTHLY = 'price_month_test';
		testEnv.STRIPE_PRICE_ID_YEARLY = 'price_year_test';

		stripeMocks.customersCreate.mockResolvedValue({ id: 'cus_test_1' });
		stripeMocks.checkoutSessionsCreate.mockResolvedValue({
			url: 'https://checkout.stripe.test/session_1'
		});

		const response = await checkout({
			request: new Request('http://localhost/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ interval: 'month' })
			}),
			locals,
			url: new URL('http://localhost:5173/api/stripe/checkout')
		} as Parameters<typeof checkout>[0]);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			ok: true,
			url: 'https://checkout.stripe.test/session_1'
		});

		const { eq } = await import('drizzle-orm');
		const { householdTable } = await import('$lib/infrastructure/db/schema');
		const rows = await integrationDb.db
			.select({ stripeCustomerId: householdTable.stripeCustomerId })
			.from(householdTable)
			.where(eq(householdTable.id, HOUSEHOLD_ID));
		expect(rows[0]?.stripeCustomerId).toBe('cus_test_1');
	});

	it('webhook rejects missing signature', async () => {
		testEnv.STRIPE_SECRET_KEY = 'sk_test_integration';
		testEnv.STRIPE_WEBHOOK_SECRET = 'whsec_test';

		const response = await webhook({
			request: new Request('http://localhost/api/stripe/webhook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{}'
			}),
			locals
		} as Parameters<typeof webhook>[0]);

		expect(response.status).toBe(400);
	});

	it('webhook activates pro on checkout.session.completed', async () => {
		testEnv.STRIPE_SECRET_KEY = 'sk_test_integration';
		testEnv.STRIPE_WEBHOOK_SECRET = 'whsec_test';

		stripeMocks.webhooksConstructEvent.mockReturnValue({
			type: 'checkout.session.completed',
			data: {
				object: {
					metadata: { householdId: HOUSEHOLD_ID },
					client_reference_id: HOUSEHOLD_ID,
					subscription: 'sub_test_1'
				}
			}
		});
		stripeMocks.subscriptionsRetrieve.mockResolvedValue({ id: 'sub_test_1', status: 'active' });

		const response = await webhook({
			request: new Request('http://localhost/api/stripe/webhook', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'stripe-signature': 'sig_test'
				},
				body: '{"id":"evt_1"}'
			}),
			locals
		} as Parameters<typeof webhook>[0]);

		expect(response.status).toBe(200);

		const tier = await billingService.getPlanTier(HOUSEHOLD_ID);
		expect(tier).toBe('pro');
	});
});
