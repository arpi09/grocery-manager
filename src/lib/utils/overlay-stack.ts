export const OVERLAY_STACK_CHANGED_EVENT = 'home-pantry-overlay-stack-changed';

export type BlockingOverlayKind =
	| 'onboarding'
	| 'receipt-success'
	| 'share'
	| 'survey'
	| 'celebration'
	| 'hint'
	| 'invite';

/**
 * Session overlay mutex (UX_GUIDELINES §12): at most one promotional overlay per tab session.
 * Priority when multiple are eligible: onboarding → receipt-success → share → survey →
 * celebration → hint → invite.
 */
const OVERLAY_PRIORITY: Record<BlockingOverlayKind, number> = {
	onboarding: 100,
	'receipt-success': 90,
	share: 70,
	survey: 60,
	celebration: 50,
	hint: 40,
	invite: 30
};

let sessionOverlayKind: BlockingOverlayKind | null = null;

let blockingOverlayCount = 0;
const registry = new Map<symbol, BlockingOverlayKind>();

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

export function getTopBlockingOverlayKind(): BlockingOverlayKind | null {
	let top: BlockingOverlayKind | null = null;
	let maxPriority = -1;

	for (const kind of registry.values()) {
		const priority = OVERLAY_PRIORITY[kind];
		if (priority > maxPriority) {
			maxPriority = priority;
			top = kind;
		}
	}

	return top;
}

/** True when no higher-priority overlay is already registered. */
export function canShowBlockingOverlay(kind: BlockingOverlayKind): boolean {
	const top = getTopBlockingOverlayKind();
	if (!top) {
		return true;
	}

	return OVERLAY_PRIORITY[kind] >= OVERLAY_PRIORITY[top];
}

/** True when this kind may claim the single session overlay slot. */
export function canClaimSessionOverlay(kind: BlockingOverlayKind): boolean {
	return sessionOverlayKind === null || sessionOverlayKind === kind;
}

/** Reserve the session overlay slot for this kind (first claim wins for the tab). */
export function claimSessionOverlay(kind: BlockingOverlayKind): void {
	if (sessionOverlayKind === null) {
		sessionOverlayKind = kind;
		notifyOverlayStackChanged();
	}
}

export function getSessionOverlayKind(): BlockingOverlayKind | null {
	return sessionOverlayKind;
}

/** @internal Test helper */
export function resetSessionOverlayForTests(): void {
	sessionOverlayKind = null;
}

/** Register while an overlay is open; cleanup runs when it closes. */
export function registerBlockingOverlay(kind: BlockingOverlayKind = 'hint'): () => void {
	const id = Symbol();
	registry.set(id, kind);
	blockingOverlayCount = registry.size;
	notifyOverlayStackChanged();
	return () => {
		registry.delete(id);
		blockingOverlayCount = registry.size;
		notifyOverlayStackChanged();
	};
}
