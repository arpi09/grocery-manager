export const OVERLAY_STACK_CHANGED_EVENT = 'home-pantry-overlay-stack-changed';

let blockingOverlayCount = 0;

function notifyOverlayStackChanged(): void {
	if (typeof window === 'undefined') {
		return;
	}

	// Defer so overlay registration effects can finish before PMF re-evaluates.
	queueMicrotask(() => {
		window.dispatchEvent(new Event(OVERLAY_STACK_CHANGED_EVENT));
	});
}

export function getBlockingOverlayCount(): number {
	return blockingOverlayCount;
}

/** Register while an overlay is open; cleanup runs when it closes. */
export function registerBlockingOverlay(): () => void {
	blockingOverlayCount += 1;
	notifyOverlayStackChanged();
	return () => {
		blockingOverlayCount = Math.max(0, blockingOverlayCount - 1);
		notifyOverlayStackChanged();
	};
}
