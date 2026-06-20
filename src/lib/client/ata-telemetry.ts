import { trackProductEvent } from '$lib/client/product-events';
import type { CalendarViewMode } from '$lib/domain/calendar-display';

export function trackPlanerViewed(): void {
	void trackProductEvent('planer_viewed');
}

export function trackAtaRecipeOpened(
	source: 'calendar' | 'ideas' | 'day_sheet',
	ideaId: string
): void {
	void trackProductEvent('ata_recipe_opened', { source, ideaId });
}

export function trackAtaWeekViewToggled(view: CalendarViewMode): void {
	void trackProductEvent('ata_week_view_toggled', { view });
}
