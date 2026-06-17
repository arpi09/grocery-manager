import type { MemoryRuleTelemetryEvent } from '$lib/domain/memory-rule-telemetry';
import type { PmfService } from '$lib/application/pmf.service';
import { recordProductEvent } from '$lib/server/product-events';

export function emitMemoryRuleEvent(
	pmfService: PmfService,
	event: MemoryRuleTelemetryEvent
): void {
	recordProductEvent(pmfService, {
		userId: event.userId,
		householdId: event.householdId,
		eventType: event.eventType,
		metadata: {
			facetType: event.facetType,
			normalizedKey: event.normalizedKey,
			...(event.field ? { field: event.field } : {})
		}
	});
}
