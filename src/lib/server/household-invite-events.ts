import type { PmfService } from '$lib/application/pmf.service';
import { recordProductEvent } from '$lib/server/product-events';

export type HouseholdInviteChannel = 'share_api' | 'settings';

export function recordHouseholdInviteSent(
	pmfService: PmfService,
	options: {
		userId: string;
		householdId: string;
		context: string;
		channel: HouseholdInviteChannel;
	}
): void {
	const metadata = { context: options.context, channel: options.channel };

	recordProductEvent(pmfService, {
		userId: options.userId,
		householdId: options.householdId,
		eventType: 'household_invite_created',
		metadata
	});

	recordProductEvent(pmfService, {
		userId: options.userId,
		householdId: options.householdId,
		eventType: 'household_invite_sent',
		metadata
	});
}
