import { describe, expect, it } from 'vitest';
import {
	deriveReceiptForwardToken,
	ReceiptForwardService
} from './receipt-forward.service';
import type { IReceiptForwardRepository } from '$lib/infrastructure/repositories/receipt-forward.repository';
import { hashSecureToken } from '$lib/infrastructure/auth/secure-token';

function createRepo(overrides: Partial<IReceiptForwardRepository> = {}): IReceiptForwardRepository {
	const rows = new Map<string, { householdId: string; tokenHash: string }>();
	return {
		findByTokenHash: async (tokenHash) => {
			for (const row of rows.values()) {
				if (row.tokenHash === tokenHash) return row;
			}
			return null;
		},
		findByHouseholdId: async (householdId) => rows.get(householdId) ?? null,
		listHouseholdIds: async () => ['household-a', 'household-b'],
		upsertToken: async (_id, householdId, tokenHash) => {
			rows.set(householdId, { householdId, tokenHash });
		},
		...overrides
	};
}

describe('ReceiptForwardService', () => {
	const secret = 'test-secret';

	it('derives stable token per household', () => {
		const first = deriveReceiptForwardToken('household-a', secret);
		const second = deriveReceiptForwardToken('household-a', secret);
		expect(first).toBe(second);
		expect(first.length).toBeGreaterThanOrEqual(16);
	});

	it('resolves household from derived token without prior row', async () => {
		const service = new ReceiptForwardService(createRepo(), secret);
		const token = deriveReceiptForwardToken('household-b', secret);
		await expect(service.resolveHouseholdId(token)).resolves.toBe('household-b');
	});

	it('returns forward token for settings display', async () => {
		const repo = createRepo();
		const service = new ReceiptForwardService(repo, secret);
		const token = await service.getForwardToken('household-a');
		expect(token).toBe(deriveReceiptForwardToken('household-a', secret));
		expect(await repo.findByHouseholdId('household-a')).toEqual({
			householdId: 'household-a',
			tokenHash: hashSecureToken(token)
		});
	});
});
