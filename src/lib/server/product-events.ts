import type { PmfService } from '$lib/application/pmf.service';
import type { ProductEventType } from '$lib/domain/pmf';

export interface RecordProductEventOptions {
	userId: string;
	householdId: string | null;
	eventType: ProductEventType;
	metadata?: Record<string, unknown>;
}

export function recordProductEvent(
	pmfService: PmfService,
	options: RecordProductEventOptions
): void {
	void pmfService.recordEvent(options).catch((error: unknown) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[product-event] Failed to record ${options.eventType}: ${message}`);
	});
}
