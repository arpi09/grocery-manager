import { trackProductEvent } from '$lib/client/product-events';
import type { StorageLocation } from '$lib/domain/location';
import { getLocale, type Locale } from '$lib/i18n';
import { locationLabel } from '$lib/i18n/domain-labels';
import {
	recordActivationScanSave,
	shouldShowOnboarding,
	type ActivationSuccessItemSnapshot
} from '$lib/utils/onboarding';

export interface OnboardingScanItemInput {
	name: string;
	location: StorageLocation;
	expiresOn?: string | null;
}

export async function recordOnboardingScanSave(
	userId: string | null | undefined,
	items: OnboardingScanItemInput[],
	locale: Locale = getLocale()
): Promise<boolean> {
	if (!userId || !shouldShowOnboarding(userId) || items.length === 0) {
		return false;
	}

	const snapshot: ActivationSuccessItemSnapshot[] = items
		.filter((item) => item.name.trim().length > 0)
		.slice(0, 3)
		.map((item) => ({
			name: item.name.trim(),
			locationLabel: locationLabel(locale, item.location),
			expiresOn: item.expiresOn ?? null
		}));

	const recorded = recordActivationScanSave(userId, snapshot);
	if (recorded) {
		await trackProductEvent('onboarding_scan_completed');
		await trackProductEvent('onboarding_inventory_created');
	}

	return recorded;
}

export function recordOnboardingScanSaveSync(
	userId: string | null | undefined,
	items: OnboardingScanItemInput[],
	locale: Locale = getLocale()
): boolean {
	if (!userId || !shouldShowOnboarding(userId) || items.length === 0) {
		return false;
	}

	const snapshot: ActivationSuccessItemSnapshot[] = items
		.filter((item) => item.name.trim().length > 0)
		.slice(0, 3)
		.map((item) => ({
			name: item.name.trim(),
			locationLabel: locationLabel(locale, item.location),
			expiresOn: item.expiresOn ?? null
		}));

	const recorded = recordActivationScanSave(userId, snapshot);
	if (recorded) {
		void trackProductEvent('onboarding_scan_completed');
		void trackProductEvent('onboarding_inventory_created');
	}
	return recorded;
}
