import type { MessageKey } from '$lib/i18n/messages';

/** Meal periods for time-aware home suggestions (frukost / lunch / middag / kväll). */
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'evening';

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

const MEAL_SLOT_RANGES: Array<{ slot: MealSlot; start: number; end: number }> = [
	{ slot: 'breakfast', start: 5, end: 10 },
	{ slot: 'lunch', start: 11, end: 13 },
	{ slot: 'dinner', start: 17, end: 20 },
	{ slot: 'evening', start: 21, end: 23 }
];

/** Returns the active meal slot for recipe suggestions (defaults to dinner off-peak hours). */
export function getCurrentMealSlot(date = new Date()): MealSlot {
	const hour = date.getHours();

	for (const range of MEAL_SLOT_RANGES) {
		if (hour >= range.start && hour <= range.end) {
			return range.slot;
		}
	}

	if (hour >= 14 && hour < 17) {
		return 'lunch';
	}

	return hour < 5 || hour >= 21 ? 'evening' : 'dinner';
}

/** Greeting tone for the home hero header. */
export function getTimeOfDay(date = new Date()): TimeOfDay {
	const hour = date.getHours();
	if (hour >= 5 && hour < 11) {
		return 'morning';
	}
	if (hour >= 11 && hour < 18) {
		return 'day';
	}
	if (hour >= 18 && hour < 22) {
		return 'evening';
	}
	return 'night';
}

export function mealSlotMessageKey(slot: MealSlot): MessageKey {
	return `home.mealSlot.${slot}` as MessageKey;
}

type TimeOfDayGreetingKey =
	| 'home.greetingMorning'
	| 'home.greetingDay'
	| 'home.greetingEvening'
	| 'home.greetingNight';

export function timeOfDayGreetingKey(time: TimeOfDay): TimeOfDayGreetingKey {
	const map: Record<TimeOfDay, TimeOfDayGreetingKey> = {
		morning: 'home.greetingMorning',
		day: 'home.greetingDay',
		evening: 'home.greetingEvening',
		night: 'home.greetingNight'
	};
	return map[time];
}
