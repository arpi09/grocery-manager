import type {
	IPmfRepository,
	RecordProductEventInput
} from '$lib/infrastructure/repositories/pmf.repository';
import type { PmfMetricSnapshot } from '$lib/domain/pmf';

export class PmfService {
	constructor(private readonly repository: IPmfRepository) {}

	recordEvent(input: RecordProductEventInput): Promise<void> {
		return this.repository.recordEvent(input);
	}

	getGlobalMetrics(now?: Date): Promise<PmfMetricSnapshot> {
		return this.repository.getGlobalMetrics(now);
	}
}
