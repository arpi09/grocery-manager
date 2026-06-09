import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppSettingsService } from '$lib/application/app-settings.service';
import { DrizzleAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		EMAIL_SENDING_DISABLED: undefined as string | undefined,
		STRIPE_CHECKOUT_DISABLED: undefined as string | undefined,
		STRIPE_SECRET_KEY: undefined as string | undefined,
		STRIPE_PRICE_ID_MONTHLY: undefined as string | undefined,
		STRIPE_PRICE_ID_YEARLY: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

describe('App settings integration', () => {
	let integrationDb: IntegrationDbContext;
	let appSettingsService: AppSettingsService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		appSettingsService = new AppSettingsService(
			new DrizzleAppSettingsRepository(integrationDb.db)
		);
	}, 30_000);

	beforeEach(async () => {
		mockEnv.EMAIL_SENDING_DISABLED = undefined;
		mockEnv.STRIPE_CHECKOUT_DISABLED = undefined;
		mockEnv.STRIPE_SECRET_KEY = undefined;
		mockEnv.STRIPE_PRICE_ID_MONTHLY = undefined;
		mockEnv.STRIPE_PRICE_ID_YEARLY = undefined;
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('defaults email sending to disabled when unset', async () => {
		const status = await appSettingsService.getEmailSendingStatus();
		expect(status.enabledInApp).toBe(false);
		expect(status.effective).toBe(false);
	});

	it('persists admin email sending toggle', async () => {
		await appSettingsService.setEmailSendingEnabled(true);

		const status = await appSettingsService.getEmailSendingStatus();
		expect(status.enabledInApp).toBe(true);
		expect(status.effective).toBe(true);

		await appSettingsService.setEmailSendingEnabled(false);

		const afterOff = await appSettingsService.getEmailSendingStatus();
		expect(afterOff.enabledInApp).toBe(false);
		expect(afterOff.effective).toBe(false);
	});

	it('defaults stripe checkout to disabled when unset', async () => {
		const status = await appSettingsService.getStripeCheckoutStatus();
		expect(status.enabledInApp).toBe(false);
		expect(status.effective).toBe(false);
	});

	it('persists admin stripe checkout toggle', async () => {
		mockEnv.STRIPE_SECRET_KEY = 'sk_test';
		mockEnv.STRIPE_PRICE_ID_MONTHLY = 'price_month';
		mockEnv.STRIPE_PRICE_ID_YEARLY = 'price_year';

		await appSettingsService.setStripeCheckoutEnabled(true);

		const status = await appSettingsService.getStripeCheckoutStatus();
		expect(status.enabledInApp).toBe(true);
		expect(status.keysConfigured).toBe(true);
		expect(status.effective).toBe(true);

		await appSettingsService.setStripeCheckoutEnabled(false);

		const afterOff = await appSettingsService.getStripeCheckoutStatus();
		expect(afterOff.enabledInApp).toBe(false);
		expect(afterOff.effective).toBe(false);
	});

	it('blocks stripe checkout when STRIPE_CHECKOUT_DISABLED is set', async () => {
		mockEnv.STRIPE_SECRET_KEY = 'sk_test';
		mockEnv.STRIPE_PRICE_ID_MONTHLY = 'price_month';
		mockEnv.STRIPE_PRICE_ID_YEARLY = 'price_year';
		mockEnv.STRIPE_CHECKOUT_DISABLED = 'true';

		await appSettingsService.setStripeCheckoutEnabled(true);

		const status = await appSettingsService.getStripeCheckoutStatus();
		expect(status.enabledInApp).toBe(true);
		expect(status.envDisabled).toBe(true);
		expect(status.effective).toBe(false);
	});
});
