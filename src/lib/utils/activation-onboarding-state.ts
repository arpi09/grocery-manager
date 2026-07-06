/** Pure state machine for activation onboarding (v8) — no storage side effects. */

export type ActivationScreen = 'welcome' | 'fill' | 'invite' | 'finish';

export type ActivationProgressMilestone = 'welcome' | 'fill' | 'invite' | 'finish';

export interface ActivationOnboardingFlags {
	welcomeSeen: boolean;
	scanStarted: boolean;
	fillDeferred: boolean;
	firstScanDone: boolean;
	inventoryCreated: boolean;
	staplesAdded: boolean;
	inviteSeen: boolean;
	finishSeen: boolean;
}

import type { StorageLocation } from '$lib/domain/location';

export interface ActivationSuccessItemSnapshot {
	name: string;
	locationLabel: string;
	location?: StorageLocation;
	expiresOn?: string | null;
}

export interface DeriveActivationOptions {
	/** Household member count — invite screen is bypassed when > 1. */
	memberCount?: number;
}

function hasSeededInventory(flags: ActivationOnboardingFlags, inventoryCount: number): boolean {
	return (
		inventoryCount >= 1 || flags.firstScanDone || flags.inventoryCreated || flags.staplesAdded
	);
}

export function deriveActivationScreen(
	flags: ActivationOnboardingFlags,
	inventoryCount: number,
	flowComplete: boolean,
	options?: DeriveActivationOptions
): ActivationScreen | 'complete' {
	if (flowComplete || flags.finishSeen) {
		return 'complete';
	}

	if (!flags.welcomeSeen) {
		return 'welcome';
	}

	if (!hasSeededInventory(flags, inventoryCount) && !flags.fillDeferred) {
		return 'fill';
	}

	const memberCount = options?.memberCount ?? 1;
	if (!flags.inviteSeen && memberCount <= 1) {
		return 'invite';
	}

	return 'finish';
}

export function getActivationProgressChecklist(
	flags: ActivationOnboardingFlags,
	inventoryCount: number
): Record<ActivationProgressMilestone, boolean> {
	return {
		welcome: flags.welcomeSeen,
		fill: hasSeededInventory(flags, inventoryCount),
		invite: flags.inviteSeen,
		finish: flags.finishSeen
	};
}

export type ActivationTelemetryStep = ActivationScreen;

export function activationScreenToTelemetryStep(screen: ActivationScreen): ActivationTelemetryStep {
	return screen;
}
