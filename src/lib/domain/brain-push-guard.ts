/** Max proactive brain pushes per user per calendar day (UTC). */
export const MAX_BRAIN_PUSHES_PER_DAY = 3;

export function brainPushDayKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function canSendBrainPush(
	dailyCount: number,
	dailyDate: string | null | undefined,
	now = new Date()
): boolean {
	const today = brainPushDayKey(now);
	if (dailyDate !== today) {
		return true;
	}
	return dailyCount < MAX_BRAIN_PUSHES_PER_DAY;
}

export function nextBrainPushDailyState(
	dailyCount: number,
	dailyDate: string | null | undefined,
	now = new Date()
): { count: number; date: string } {
	const today = brainPushDayKey(now);
	if (dailyDate !== today) {
		return { count: 1, date: today };
	}
	return { count: dailyCount + 1, date: today };
}

/** Friday/Saturday reminder when dominant shop day is 1–2 days ahead. */
export function isPreShopReminderDay(todayWeekday: number, cadenceWeekday: number): boolean {
	const daysUntilShop = (cadenceWeekday - todayWeekday + 7) % 7;
	return daysUntilShop === 1 || daysUntilShop === 2;
}

export const WEEKLY_BRIEFING_INTERVAL_DAYS = 6;
export const PRE_SHOP_BRIEFING_INTERVAL_DAYS = 5;

export function shouldSendIntervalPush(
	lastSentAt: Date | null | undefined,
	intervalDays: number,
	now = new Date()
): boolean {
	if (!lastSentAt) {
		return true;
	}
	const elapsedMs = now.getTime() - lastSentAt.getTime();
	return elapsedMs >= intervalDays * 24 * 60 * 60 * 1000;
}
