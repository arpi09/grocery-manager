import { browser } from '$app/environment';
import type { ShoppingTripMode } from '$lib/domain/shopping-trip';

const SESSION_PREFIX = 'skaffu-shopping-v2';

export interface ShoppingTripSession {
	mode: ShoppingTripMode;
	focusIndex: number;
	tripTotal: number;
	pickedCount: number;
	tripStartedAt: number | null;
}

export function shoppingTripSessionKey(householdId: string): string {
	return `${SESSION_PREFIX}-${householdId}`;
}

export function defaultShoppingTripSession(): ShoppingTripSession {
	return {
		mode: 'plan',
		focusIndex: 0,
		tripTotal: 0,
		pickedCount: 0,
		tripStartedAt: null
	};
}

export function readShoppingTripSession(householdId: string): ShoppingTripSession | null {
	if (!browser || !householdId) {
		return null;
	}

	try {
		const raw = sessionStorage.getItem(shoppingTripSessionKey(householdId));
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw) as ShoppingTripSession;
		if (parsed.mode !== 'plan' && parsed.mode !== 'shop') {
			return null;
		}
		return {
			mode: parsed.mode,
			focusIndex: Number.isFinite(parsed.focusIndex) ? parsed.focusIndex : 0,
			tripTotal: Number.isFinite(parsed.tripTotal) ? parsed.tripTotal : 0,
			pickedCount: Number.isFinite(parsed.pickedCount) ? parsed.pickedCount : 0,
			tripStartedAt:
				typeof parsed.tripStartedAt === 'number' ? parsed.tripStartedAt : null
		};
	} catch {
		return null;
	}
}

export function writeShoppingTripSession(householdId: string, session: ShoppingTripSession): void {
	if (!browser || !householdId) {
		return;
	}
	sessionStorage.setItem(shoppingTripSessionKey(householdId), JSON.stringify(session));
}

export function clearShoppingTripSession(householdId: string): void {
	if (!browser || !householdId) {
		return;
	}
	sessionStorage.removeItem(shoppingTripSessionKey(householdId));
}
