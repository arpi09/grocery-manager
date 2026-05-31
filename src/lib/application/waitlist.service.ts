import {
	WAITLIST_LIST_DEFAULT,
	WAITLIST_LIST_MAX,
	type JoinWaitlistInput,
	type WaitlistEntry
} from '$lib/domain/waitlist';
import type { IWaitlistRepository } from '$lib/infrastructure/repositories/waitlist.repository';

export class WaitlistService {
	constructor(private readonly repository: IWaitlistRepository) {}

	async join(input: JoinWaitlistInput): Promise<'created' | 'exists'> {
		return this.repository.join(input);
	}

	async count(): Promise<number> {
		return this.repository.count();
	}

	async listRecent(limit = WAITLIST_LIST_DEFAULT): Promise<WaitlistEntry[]> {
		const safeLimit = Math.min(WAITLIST_LIST_MAX, Math.max(1, Math.floor(limit)));
		return this.repository.listRecent(safeLimit);
	}
}
