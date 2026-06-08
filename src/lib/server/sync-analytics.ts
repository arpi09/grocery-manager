import type { PmfService } from '$lib/application/pmf.service';
import {
	SYNC_ANALYTICS_EVENTS,
	type InventoryWriteAction
} from '$lib/domain/sync-analytics';
import { recordProductEvent } from '$lib/server/product-events';

export function trackInventoryWrite(
	pmfService: PmfService,
	options: {
		userId: string;
		householdId: string | null;
		action: InventoryWriteAction;
		itemId?: string;
	}
): void {
	recordProductEvent(pmfService, {
		userId: options.userId,
		householdId: options.householdId,
		eventType: SYNC_ANALYTICS_EVENTS.INVENTORY_WRITE,
		metadata: {
			action: options.action,
			...(options.itemId ? { itemId: options.itemId } : {})
		}
	});
}

export function trackStalenessConfirmed(
	pmfService: PmfService,
	options: { userId: string; householdId: string; itemId: string }
): void {
	recordProductEvent(pmfService, {
		userId: options.userId,
		householdId: options.householdId,
		eventType: SYNC_ANALYTICS_EVENTS.STALENESS_CONFIRMED,
		metadata: { itemId: options.itemId }
	});
	trackInventoryWrite(pmfService, { ...options, action: 'confirm' });
}

export function trackBatchReviewCompleted(
	pmfService: PmfService,
	options: { userId: string; householdId: string; reviewedCount: number }
): void {
	recordProductEvent(pmfService, {
		userId: options.userId,
		householdId: options.householdId,
		eventType: SYNC_ANALYTICS_EVENTS.BATCH_REVIEW_COMPLETED,
		metadata: { reviewedCount: options.reviewedCount }
	});
}

export function trackShoppingCheckoffToPantry(
	pmfService: PmfService,
	options: {
		userId: string;
		householdId: string;
		added: boolean;
		action?: string;
		mode?: string;
	}
): void {
	recordProductEvent(pmfService, {
		userId: options.userId,
		householdId: options.householdId,
		eventType: SYNC_ANALYTICS_EVENTS.SHOPPING_CHECKOFF_TO_PANTRY,
		metadata: {
			added: options.added,
			...(options.action ? { action: options.action } : {}),
			...(options.mode ? { mode: options.mode } : {})
		}
	});
}

/** Callable from Phase 1 one-tap consume UI. */
export function trackOneTapConsume(
	pmfService: PmfService,
	options: { userId: string; householdId: string; itemId: string }
): void {
	recordProductEvent(pmfService, {
		userId: options.userId,
		householdId: options.householdId,
		eventType: SYNC_ANALYTICS_EVENTS.ONE_TAP_CONSUME,
		metadata: { itemId: options.itemId }
	});
	trackInventoryWrite(pmfService, { ...options, action: 'consume' });
}
