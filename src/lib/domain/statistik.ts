export type WeeklyCount = {
	weekStart: string;
	count: number;
};

export type WeeklyBar = WeeklyCount & {
	label: string;
};

export type WeekOverWeek = {
	thisWeek: number;
	lastWeek: number;
	delta: number;
	deltaPercent: number | null;
};

export function startOfWeek(date: Date): Date {
	const result = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	);
	const day = result.getUTCDay();
	const diff = day === 0 ? -6 : 1 - day;
	result.setUTCDate(result.getUTCDate() + diff);
	return result;
}

export function toIsoDate(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function buildLastNWeekBars(
	counts: WeeklyCount[],
	weekCount: number,
	referenceDate: Date = new Date()
): WeeklyBar[] {
	const currentWeekStart = startOfWeek(referenceDate);
	const bars: WeeklyBar[] = [];

	for (let offset = weekCount - 1; offset >= 0; offset -= 1) {
		const weekStart = new Date(currentWeekStart);
		weekStart.setUTCDate(weekStart.getUTCDate() - offset * 7);
		const weekStartIso = toIsoDate(weekStart);
		const match = counts.find((entry) => entry.weekStart === weekStartIso);
		bars.push({
			weekStart: weekStartIso,
			count: match?.count ?? 0,
			label: formatWeekLabel(weekStart, offset === 0)
		});
	}

	return bars;
}

export function formatWeekLabel(weekStart: Date, isCurrentWeek: boolean): string {
	if (isCurrentWeek) {
		return 'current';
	}

	const end = new Date(weekStart);
	end.setUTCDate(end.getUTCDate() + 6);
	const startDay = weekStart.getUTCDate();
	const endDay = end.getUTCDate();
	const startMonth = weekStart.toLocaleDateString('sv-SE', { month: 'short', timeZone: 'UTC' });
	const endMonth = end.toLocaleDateString('sv-SE', { month: 'short', timeZone: 'UTC' });

	if (startMonth === endMonth) {
		return `${startDay}–${endDay} ${startMonth}`;
	}

	return `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

export function computeWeekOverWeek(bars: WeeklyBar[]): WeekOverWeek | null {
	if (bars.length < 2) {
		return null;
	}

	const thisWeek = bars[bars.length - 1]?.count ?? 0;
	const lastWeek = bars[bars.length - 2]?.count ?? 0;
	const delta = thisWeek - lastWeek;
	const deltaPercent = lastWeek === 0 ? (thisWeek > 0 ? 100 : null) : Math.round((delta / lastWeek) * 100);

	return { thisWeek, lastWeek, delta, deltaPercent };
}

export function computeZeroWasteStreak(
	wasteByWeek: WeeklyBar[],
	consumedByWeek: WeeklyBar[]
): number {
	const firstConsumptionIndex = consumedByWeek.findIndex((bar) => bar.count > 0);
	if (firstConsumptionIndex === -1) {
		return 0;
	}

	let streak = 0;
	for (let index = wasteByWeek.length - 1; index >= firstConsumptionIndex; index -= 1) {
		if (wasteByWeek[index].count > 0) {
			break;
		}
		streak += 1;
	}
	return streak;
}

/** Inclusive calendar weeks from household creation week through reference week. */
export function weeksSinceHouseholdCreated(
	householdCreatedAt: Date,
	referenceDate: Date = new Date()
): number {
	const createdWeek = startOfWeek(householdCreatedAt);
	const currentWeek = startOfWeek(referenceDate);
	const diffDays = Math.floor((currentWeek.getTime() - createdWeek.getTime()) / (24 * 60 * 60 * 1000));
	return Math.floor(diffDays / 7) + 1;
}

export function capZeroWasteStreak(streak: number, maxWeeks: number): number {
	if (maxWeeks < 1) {
		return 0;
	}
	return Math.min(Math.max(0, streak), maxWeeks);
}

export function maxWeeklyCount(bars: WeeklyBar[]): number {
	return bars.reduce((max, bar) => Math.max(max, bar.count), 0);
}
