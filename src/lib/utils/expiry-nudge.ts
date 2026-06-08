export const EXPIRY_NUDGE_ITEM_PARAM = 'expiryNudgeItem';
export const EXPIRY_NUDGE_NAME_PARAM = 'expiryNudgeName';

export function buildReturnUrlWithExpiryNudge(
	returnTo: string,
	itemId: string,
	itemName: string
): string {
	const url = new URL(returnTo, 'http://local');
	url.searchParams.set(EXPIRY_NUDGE_ITEM_PARAM, itemId);
	url.searchParams.set(EXPIRY_NUDGE_NAME_PARAM, itemName);
	return `${url.pathname}${url.search}`;
}
