/**
 * Nav and pantry layout breakpoint (899px).
 *
 * Intentionally wider than `device.ts` (`MOBILE_MAX_WIDTH_PX` = 768), which gates
 * barcode/camera scan UX. Do not reuse this query for scan flows.
 */
export const NAV_NARROW_MAX_PX = 899;

export const NAV_NARROW_MEDIA_QUERY = `(max-width: ${NAV_NARROW_MAX_PX}px)`;

/** Subscribes to the nav/pantry narrow viewport; returns cleanup. SSR-safe. */
export function subscribeNarrowViewport(onChange: (isNarrow: boolean) => void): () => void {
	if (typeof window === 'undefined') {
		return () => {};
	}

	const mq = window.matchMedia(NAV_NARROW_MEDIA_QUERY);
	const sync = () => {
		onChange(mq.matches);
	};
	sync();
	mq.addEventListener('change', sync);
	return () => mq.removeEventListener('change', sync);
}
