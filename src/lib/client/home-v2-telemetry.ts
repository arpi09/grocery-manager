import { trackProductEvent } from '$lib/client/product-events';
import type { HomeBriefingForYouKind } from '$lib/domain/home-briefing';
import type { HomeBriefingStatusKey } from '$lib/domain/home-briefing';

export function trackHomeBriefingOpened(
	statusKey: HomeBriefingStatusKey,
	forYouKind: HomeBriefingForYouKind | null
): void {
	void trackProductEvent('home_briefing_opened', { statusKey, forYouKind });
}

export function trackForYouCtaTapped(kind: HomeBriefingForYouKind, destination: string): void {
	void trackProductEvent('for_you_cta_tapped', { kind, destination });
}

export function trackHomeChipTapped(chip: 'shopping' | 'storage' | 'eat' | 'funFact'): void {
	void trackProductEvent('home_chip_tapped', { chip });
}
