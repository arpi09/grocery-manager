let unreadCount = $state(0);

export function getMarketUnreadCount(): number {
	return unreadCount;
}

export function setMarketUnreadCount(count: number): void {
	unreadCount = Math.max(0, count);
}
