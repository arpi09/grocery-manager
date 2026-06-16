import { canEditInventory } from '$lib/domain/household';
import { redirect } from '@sveltejs/kit';
import { buildKivraForwardAddress, isKivraForwardEnabled } from '$lib/server/kivra-forward';
import { receiptForwardService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { householdId, householdRole } = await parent();

	const kivraForwardEnabled = isKivraForwardEnabled();
	const kivraForwardAddress =
		kivraForwardEnabled && householdId && householdRole && canEditInventory(householdRole)
			? buildKivraForwardAddress(await receiptForwardService.getForwardToken(householdId))
			: null;

	if (!kivraForwardAddress) {
		throw redirect(302, '/settings');
	}

	return { kivraForwardAddress };
};
