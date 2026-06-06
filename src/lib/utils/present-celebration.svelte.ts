import { getLocale } from '$lib/i18n';
import type { GamificationCelebrationKind, MilestoneId } from '$lib/domain/gamification';
import {
	getCelebrationRegistryEntry,
	type CelebrationSurface
} from '$lib/domain/gamification.registry';
import { celebrationMessage } from '$lib/utils/gamification-celebrate';
import {
	markCelebrationShown,
	shouldShowCelebration
} from '$lib/utils/gamification-celebrations';
import { showClientToast } from '$lib/utils/client-toast.svelte';

export type { CelebrationSurface };

export interface PresentCelebrationRequest {
	kind: GamificationCelebrationKind;
	surface: CelebrationSurface;
	householdId: string;
	userId?: string | null;
	metadata?: {
		count?: number;
		milestoneId?: MilestoneId;
		weeks?: number;
		sek?: number;
	};
}

export interface ActiveCelebrationMoment {
	request: PresentCelebrationRequest;
	title: string;
	body: string;
	illustration: 'streak' | 'milestone' | 'ritual' | 'savings';
	statsHref: boolean;
}

export const celebrationMomentStore = $state<{ active: ActiveCelebrationMoment | null }>({
	active: null
});

let sessionCelebrationShown = false;

export function resetCelebrationSessionForTests(): void {
	sessionCelebrationShown = false;
	celebrationMomentStore.active = null;
}

function resolveIllustration(
	kind: GamificationCelebrationKind
): ActiveCelebrationMoment['illustration'] {
	return getCelebrationRegistryEntry(kind)?.illustration ?? 'milestone';
}

function isStreakCelebration(kind: GamificationCelebrationKind): boolean {
	return kind === 'zeroWasteStreak' || kind === 'streak5';
}

function isMilestoneCelebration(kind: GamificationCelebrationKind): boolean {
	return (
		kind === 'firstConsumption' ||
		kind === 'weeklyRitualFirst' ||
		kind === 'savings500'
	);
}

async function recordGamificationEvent(
	request: PresentCelebrationRequest,
	phase: 'shown' | 'dismissed'
): Promise<void> {
	const metadata = {
		kind: request.kind,
		surface: request.surface,
		phase,
		...(request.metadata ?? {})
	};

	try {
		await fetch('/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eventType: 'celebration_shown',
				metadata
			})
		});
	} catch {
		// Non-blocking observability
	}

	if (phase === 'dismissed' && isMilestoneCelebration(request.kind)) {
		try {
			await fetch('/api/product-events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					eventType: 'milestone_achieved',
					metadata: {
						milestoneId: request.metadata?.milestoneId ?? request.kind,
						...(request.metadata ?? {})
					}
				})
			});
		} catch {
			// Non-blocking observability
		}
	}

	if (phase === 'dismissed' && isStreakCelebration(request.kind)) {
		try {
			await fetch('/api/product-events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					eventType: 'streak_milestone_reached',
					metadata: {
						kind: request.kind,
						weeks: request.metadata?.weeks ?? request.metadata?.count
					}
				})
			});
		} catch {
			// Non-blocking observability
		}
	}
}

export function presentCelebration(request: PresentCelebrationRequest): boolean {
	if (!request.householdId) {
		return false;
	}

	if (!shouldShowCelebration(request.kind, request.householdId)) {
		return false;
	}

	if (sessionCelebrationShown && request.surface !== 'banner') {
		return false;
	}

	const locale = getLocale();
	const message = celebrationMessage(locale, request.kind, {
		count: request.metadata?.count,
		weeks: request.metadata?.weeks,
		sek: request.metadata?.sek
	});

	if (request.surface === 'moment') {
		if (celebrationMomentStore.active) {
			return false;
		}
		celebrationMomentStore.active = {
			request,
			title: message,
			body: message,
			illustration: resolveIllustration(request.kind),
			statsHref: isMilestoneCelebration(request.kind) || isStreakCelebration(request.kind)
		};
		sessionCelebrationShown = true;
		void recordGamificationEvent(request, 'shown');
		return true;
	}

	if (request.surface === 'toast') {
		showClientToast(message, {
			variant: 'success',
			size: 'action'
		});
		sessionCelebrationShown = true;
		void recordGamificationEvent(request, 'shown');
		return true;
	}

	return false;
}

export function dismissCelebrationMoment(): void {
	const active = celebrationMomentStore.active;
	if (!active) {
		return;
	}

	markCelebrationShown(active.request.kind, active.request.householdId);
	void recordGamificationEvent(active.request, 'dismissed');
	celebrationMomentStore.active = null;
}

export function dismissCelebrationToast(kind: GamificationCelebrationKind, householdId: string): void {
	markCelebrationShown(kind, householdId);
	void recordGamificationEvent({ kind, surface: 'toast', householdId }, 'dismissed');
}
