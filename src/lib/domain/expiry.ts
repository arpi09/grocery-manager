/** Items expiring within this many days appear on the home dashboard ("Går ut snart"). */
export const EXPIRING_SOON_DAYS = 7;

export function daysUntilExpiry(expiresOn: string, today = new Date()): number {
	const [year, month, day] = expiresOn.split('-').map(Number);
	const expires = new Date(year, month - 1, day);
	const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	return Math.round((expires.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDaysLeftSv(days: number): string {
	if (days <= 0) return 'Går ut idag';
	if (days === 1) return '1 dag kvar';
	return `${days} dagar kvar`;
}

export function formatExpiryDateSv(expiresOn: string): string {
	const [year, month, day] = expiresOn.split('-').map(Number);
	return new Intl.DateTimeFormat('sv-SE', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date(year, month - 1, day));
}
