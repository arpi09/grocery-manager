/** Max one shopping-day push per calendar day per user. */
export function shouldSendShoppingPush(
	lastSentAt: Date | null | undefined,
	now = new Date()
): boolean {
	if (!lastSentAt) {
		return true;
	}
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const last = new Date(lastSentAt.getFullYear(), lastSentAt.getMonth(), lastSentAt.getDate());
	return today.getTime() > last.getTime();
}
