/**
 * Retention/sync product events (stored in `product_event`).
 *
 * - inventory_write — proxy for weekly pantry activity (create/consume/confirm/merge)
 * - batch_review_completed — user finished a staleness batch (all items actioned)
 * - one_tap_consume — single-tap "Slut" on inventory row (Phase 1)
 * - staleness_confirmed — "Ja, kvar" in batch review
 * - shopping_checkoff_to_pantry — inköpslista avbockad → skafferi (Phase 2 stub)
 * - receipt_finish_accepted — kvitto tvåvägs-sync: marked old stock finished
 */
export const SYNC_ANALYTICS_EVENTS = {
	INVENTORY_WRITE: 'inventory_write',
	BATCH_REVIEW_COMPLETED: 'batch_review_completed',
	ONE_TAP_CONSUME: 'one_tap_consume',
	STALENESS_CONFIRMED: 'staleness_confirmed',
	SHOPPING_CHECKOFF_TO_PANTRY: 'shopping_checkoff_to_pantry',
	RECEIPT_FINISH_ACCEPTED: 'receipt_finish_accepted'
} as const;

export type SyncAnalyticsEvent =
	(typeof SYNC_ANALYTICS_EVENTS)[keyof typeof SYNC_ANALYTICS_EVENTS];

export type InventoryWriteAction = 'create' | 'consume' | 'confirm' | 'merge';
