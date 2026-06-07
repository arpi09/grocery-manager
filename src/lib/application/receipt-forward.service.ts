import { createHmac } from 'node:crypto';
import { hashSecureToken } from '$lib/infrastructure/auth/secure-token';
import type { IReceiptForwardRepository } from '$lib/infrastructure/repositories/receipt-forward.repository';

export function deriveReceiptForwardToken(householdId: string, secret: string): string {
	return createHmac('sha256', secret)
		.update(`receipt-forward:${householdId}`)
		.digest('base64url')
		.slice(0, 32);
}

export class ReceiptForwardService {
	constructor(
		private readonly repository: IReceiptForwardRepository,
		private readonly secret: string
	) {}

	async getForwardToken(householdId: string): Promise<string> {
		const token = deriveReceiptForwardToken(householdId, this.secret);
		const existing = await this.repository.findByHouseholdId(householdId);
		if (!existing) {
			await this.repository.upsertToken(crypto.randomUUID(), householdId, hashSecureToken(token));
		}
		return token;
	}

	async resolveHouseholdId(token: string): Promise<string | null> {
		const tokenHash = hashSecureToken(token);
		const row = await this.repository.findByTokenHash(tokenHash);
		if (row) {
			return row.householdId;
		}

		const householdIds = await this.repository.listHouseholdIds();
		for (const householdId of householdIds) {
			const derived = deriveReceiptForwardToken(householdId, this.secret);
			if (derived === token) {
				await this.repository.upsertToken(crypto.randomUUID(), householdId, tokenHash);
				return householdId;
			}
		}

		return null;
	}
}
