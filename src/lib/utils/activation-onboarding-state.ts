/** Pure state machine for activation onboarding (v7) — no storage side effects. */

export type ActivationScreen = 'welcome' | 'scan' | 'success' | 'brain' | 'shopping';

export type ActivationProgressMilestone =
	| 'welcome'
	| 'firstScan'
	| 'pantryCreated'
	| 'brain'
	| 'shopping';

export interface ActivationOnboardingFlags {
	welcomeSeen: boolean;
	scanStarted: boolean;
	scanDeferred: boolean;
	firstScanDone: boolean;
	inventoryCreated: boolean;
	successSeen: boolean;
	brainSeen: boolean;
	shoppingSeen: boolean;
}

import type { StorageLocation } from '$lib/domain/location';

export interface ActivationSuccessItemSnapshot {
	name: string;
	locationLabel: string;
	location?: StorageLocation;
	expiresOn?: string | null;
}

export function deriveActivationScreen(
	flags: ActivationOnboardingFlags,
	inventoryCount: number,
	flowComplete: boolean,
	options?: { skipSuccessScreen?: boolean }
): ActivationScreen | 'complete' {
	if (flowComplete || flags.shoppingSeen) {
		return 'complete';
	}

	const hasInventory =
		inventoryCount >= 1 || flags.firstScanDone || flags.inventoryCreated;

	if (!hasInventory) {
		return flags.welcomeSeen ? 'scan' : 'welcome';
	}

	if (!flags.successSeen && !options?.skipSuccessScreen) {
		return 'success';
	}

	if (!flags.brainSeen) {
		return 'brain';
	}

	return 'shopping';
}

export function getActivationProgressChecklist(
	flags: ActivationOnboardingFlags,
	inventoryCount: number
): Record<ActivationProgressMilestone, boolean> {
	return {
		welcome: flags.welcomeSeen,
		firstScan: flags.firstScanDone,
		pantryCreated: flags.inventoryCreated || inventoryCount >= 1,
		brain: flags.brainSeen,
		shopping: flags.shoppingSeen
	};
}

export type ActivationTelemetryStep = ActivationScreen;

export function activationScreenToTelemetryStep(screen: ActivationScreen): ActivationTelemetryStep {
	return screen;
}
