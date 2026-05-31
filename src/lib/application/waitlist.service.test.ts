import { describe, expect, it, vi } from 'vitest';
import { WaitlistService } from './waitlist.service';
import type { IWaitlistRepository } from '$lib/infrastructure/repositories/waitlist.repository';

describe('WaitlistService', () => {
	it('caps list limit', async () => {
		const repository: IWaitlistRepository = {
			join: vi.fn(),
			count: vi.fn(),
			listRecent: vi.fn().mockResolvedValue([])
		};
		const service = new WaitlistService(repository);

		await service.listRecent(9999);

		expect(repository.listRecent).toHaveBeenCalledWith(200);
	});
});
