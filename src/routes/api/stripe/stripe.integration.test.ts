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
		STRIPE_CHECKOUT_DISABLED: undefined as string | undefined,
		ORIGIN: 'http://localhost:5173',
		PUBLIC_ORIGIN: 'http://localhost:5173'
	},
	stripeMocks: {
		customersCreate: vi.fn(),
		checkoutSessionsCreate: vi.fn(),
		billingPortalSessionsCreate: vi.fn(),
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
		billingPortal = { sessions: { create: stripeMocks.billingPortalSessionsCreate } };
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
	let appSettingsService: import('$lib/application/app-settings.service').AppSettingsService;
	let checkout: typeof import('./checkout/+server').POST;
	let portal: typeof import('./portal/+server').POST;
	let webhook: typeof import('./webhook/+server').POST;
	let locals: App.Locals;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		dbState.db = integrationDb.db;

		const [{ BillingService }, { DrizzleBillingRepository }, { AppSettingsService }, { DrizzleAppSettingsRepository }, checkoutMod, portalMod, webhookMod] =
			await Promise.all([
				import('$lib/application/billing.service'),
				import('$lib/infrastructure/repositories/billing.repository'),
				import('$lib/application/app-settings.service'),
				import('$lib/infrastructure/repositories/app-settings.repository'),
				import('./checkout/+server'),
				import('./portal/+server'),
				import('./webhook/+server')
			]);

		const { stripeAdapter } = await import('$lib/infrastructure/adapters/stripe.adapter');
		const { appOriginAdapter } = await import('$lib/infrastructure/adapters/app-origin.adapter');
		appSettingsService = new AppSettingsService(new DrizzleAppSettingsRepository(integrationDb.db));
		billingService = new BillingService(
			new DrizzleBillingRepository(integrationDb.db),
			stripeAdapter,
			appOriginAdapter,
			appSettingsService
		);
		checkout = checkoutMod.POST;
		portal = portalMod.POST;
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
		testEnv.STRIPE_CHECKOUT_DISABLED = undefined;
		stripeMocks.customersCreate.mockReset();
		stripeMocks.checkoutSessionsCreate.mockReset();
		stripeMocks.billingPortalSessionsCreate.mockReset();
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

	it('checkout returns 503 when keys are set but admin toggle is off', async () => {
		testEnv.STRIPE_SECRET_KEY = 'sk_test_integration';
		testEnv.STRIPE_PRICE_ID_MONTHLY = 'price_month_test';
		testEnv.STRIPE_PRICE_ID_YEARLY = 'price_year_test';

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
		await appSettingsService.setStripeCheckoutEnabled(true);

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

	it('portal returns 409 without stripe customer', async () => {
		testEnv.STRIPE_SECRET_KEY = 'sk_test_integration';
		testEnv.STRIPE_PRICE_ID_MONTHLY = 'price_month_test';
		testEnv.STRIPE_PRICE_ID_YEARLY = 'price_year_test';
		await appSettingsService.setStripeCheckoutEnabled(true);

		const response = await portal({
			locals,
			url: new URL('http://localhost:5173/api/stripe/portal')
		} as Parameters<typeof portal>[0]);

		expect(response.status).toBe(409);
	});

	it('creates billing portal session for household with customer', async () => {
		testEnv.STRIPE_SECRET_KEY = 'sk_test_integration';
		testEnv.STRIPE_PRICE_ID_MONTHLY = 'price_month_test';
		testEnv.STRIPE_PRICE_ID_YEARLY = 'price_year_test';
		await appSettingsService.setStripeCheckoutEnabled(true);

		const { eq } = await import('drizzle-orm');
		const { householdTable } = await import('$lib/infrastructure/db/schema');
		await integrationDb.db
			.update(householdTable)
			.set({ stripeCustomerId: 'cus_portal_1' })
			.where(eq(householdTable.id, HOUSEHOLD_ID));

		stripeMocks.billingPortalSessionsCreate.mockResolvedValue({
			url: 'https://billing.stripe.test/portal_1'
		});

		const response = await portal({
			locals,
			url: new URL('http://localhost:5173/api/stripe/portal')
		} as Parameters<typeof portal>[0]);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			ok: true,
			url: 'https://billing.stripe.test/portal_1'
		});
	});

	it('admin can grant complimentary pro and clear stripe fields', async () => {
		const { eq } = await import('drizzle-orm');
		const { householdTable } = await import('$lib/infrastructure/db/schema');
		await integrationDb.db
			.update(householdTable)
			.set({
				stripeCustomerId: 'cus_old',
				stripeSubscriptionId: 'sub_old',
				stripeSubscriptionStatus: 'active'
			})
			.where(eq(householdTable.id, HOUSEHOLD_ID));

		await billingService.adminSetHouseholdPlan({
			householdId: HOUSEHOLD_ID,
			planTier: 'pro',
			clearStripe: true
		});

		const rows = await integrationDb.db
			.select({
				planTier: householdTable.planTier,
				stripeCustomerId: householdTable.stripeCustomerId,
				stripeSubscriptionId: householdTable.stripeSubscriptionId
			})
			.from(householdTable)
			.where(eq(householdTable.id, HOUSEHOLD_ID));

		expect(rows[0]).toMatchObject({
			planTier: 'pro',
			stripeCustomerId: null,
			stripeSubscriptionId: null
		});
		expect(await billingService.getPlanTier(HOUSEHOLD_ID)).toBe('pro');
	});
});
