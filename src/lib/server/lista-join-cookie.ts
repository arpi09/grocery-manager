import type { HouseholdService } from '$lib/application/household.service';
import type { PmfService } from '$lib/application/pmf.service';
import type { ShoppingListShareService } from '$lib/application/shopping-list-share.service';
import { LISTA_JOIN_COOKIE } from '$lib/marketing/acquisition-attribution';
import { recordProductEvent } from '$lib/server/product-events';

export interface ListaJoinCookieReader {
	get(name: string): string | undefined;
	delete(name: string, options?: { path?: string }): void;
}

export async function consumeListaJoinCookie(
	userId: string,
	cookies: ListaJoinCookieReader,
	services: {
		shareService: ShoppingListShareService;
		householdService: HouseholdService;
		pmfService: PmfService;
	}
): Promise<{ targetHouseholdId: string; outcome: 'joined' | 'already_member' } | null> {
	const listaJoinToken = cookies.get(LISTA_JOIN_COOKIE);
	if (!listaJoinToken) return null;

	cookies.delete(LISTA_JOIN_COOKIE, { path: '/' });
	const targetHouseholdId = await services.shareService.resolveHouseholdIdForToken(listaJoinToken);
	if (!targetHouseholdId) return null;

	const outcome = await services.householdService.joinSharedListHousehold(
		targetHouseholdId,
		userId
	);
	if (outcome === 'joined') {
		recordProductEvent(services.pmfService, {
			userId,
			householdId: targetHouseholdId,
			eventType: 'partner_joined',
			metadata: { context: 'lista' }
		});
	}

	return { targetHouseholdId, outcome };
}
