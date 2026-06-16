import { NAV_NARROW_MAX_PX } from '$lib/utils/use-narrow-viewport';

/** Inventory compact list vs data table — align with mobile nav / shopping list layout. */
export const INVENTORY_COMPACT_MAX_PX = NAV_NARROW_MAX_PX;

export const INVENTORY_COMPACT_MEDIA_QUERY = `(max-width: ${INVENTORY_COMPACT_MAX_PX}px)`;

/** Subscribes to compact inventory layout; returns cleanup. SSR-safe. */
export function subscribeCompactInventoryViewport(onChange: (isCompact: boolean) => void): () => void {
	if (typeof window === 'undefined') {
		return () => {};
	}

	const mq = window.matchMedia(INVENTORY_COMPACT_MEDIA_QUERY);
	const sync = () => {
		onChange(mq.matches);
	};
	sync();
	mq.addEventListener('change', sync);
	return () => mq.removeEventListener('change', sync);
}
