import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppSettingsService } from '$lib/application/app-settings.service';
import { DrizzleAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		EMAIL_SENDING_DISABLED: undefined as string | undefined
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
});
