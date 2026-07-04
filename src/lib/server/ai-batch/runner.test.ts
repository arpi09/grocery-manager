import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/openai-batch', () => ({
	submitBatch: vi.fn(),
	pollBatch: vi.fn(),
	fetchBatchOutput: vi.fn(),
	deleteBatchFiles: vi.fn().mockResolvedValue(undefined)
}));

import { fetchBatchOutput, pollBatch, submitBatch } from '$lib/server/openai-batch';
import { runAiBatchCycle } from './runner';
import type { AiBatchKindHandler } from './types';
import type {
	AiBatchJob,
	CreateAiBatchJobInput,
	IAiBatchJobRepository,
	UpdateAiBatchJobInput
} from '$lib/infrastructure/repositories/ai-batch-job.repository';

const submitBatchMock = vi.mocked(submitBatch);
const pollBatchMock = vi.mocked(pollBatch);
const fetchBatchOutputMock = vi.mocked(fetchBatchOutput);

class InMemoryRepo implements IAiBatchJobRepository {
	rows: AiBatchJob[] = [];
	constructor(private clock: () => number = () => Date.now()) {}

	seed(job: Partial<AiBatchJob> & Pick<AiBatchJob, 'id' | 'kind' | 'status'>): AiBatchJob {
		const row: AiBatchJob = {
			openaiBatchId: null,
			inputFileId: null,
			outputFileId: null,
			requestCount: 0,
			payload: {},
			result: null,
			error: null,
			createdAt: new Date(this.clock()),
			updatedAt: new Date(this.clock()),
			...job
		};
		this.rows.push(row);
		return row;
	}

	async create(input: CreateAiBatchJobInput): Promise<AiBatchJob> {
		return this.seed({ ...input });
	}
	async update(id: string, patch: UpdateAiBatchJobInput): Promise<void> {
		const row = this.rows.find((r) => r.id === id);
		if (row) Object.assign(row, patch, { updatedAt: new Date(this.clock()) });
	}
	async listActive(): Promise<AiBatchJob[]> {
		return this.rows.filter((r) => r.status === 'submitted' || r.status === 'completed');
	}
	async countActiveByKind(kind: AiBatchJob['kind']): Promise<number> {
		return this.rows.filter(
			(r) => r.kind === kind && (r.status === 'submitted' || r.status === 'completed')
		).length;
	}
	async latestCreatedAt(kind: AiBatchJob['kind']): Promise<Date | null> {
		const rows = this.rows.filter((r) => r.kind === kind);
		return rows.length ? rows[rows.length - 1].createdAt : null;
	}
	async listRecentApplied(): Promise<AiBatchJob[]> {
		return this.rows.filter((r) => r.status === 'applied');
	}
	async deleteOlderThan(): Promise<number> {
		return 0;
	}
}

function fakeHandler(overrides: Partial<AiBatchKindHandler> & Pick<AiBatchKindHandler, 'kind'>): AiBatchKindHandler {
	return {
		minResubmitHours: 6,
		isEnabled: () => true,
		collect: vi.fn().mockResolvedValue(null),
		apply: vi.fn().mockResolvedValue({ applied: 0, result: null }),
		...overrides
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('runAiBatchCycle', () => {
	it('is idle without an API key', async () => {
		const repo = new InMemoryRepo();
		const summary = await runAiBatchCycle({
			handlers: [fakeHandler({ kind: 'missing_expiry' })],
			repository: repo,
			apiKey: null
		});
		expect(summary.note).toMatch(/OPENAI_API_KEY/);
		expect(summary.submitted).toBe(0);
	});

	it('submits collected work and records a submitted job', async () => {
		const repo = new InMemoryRepo();
		submitBatchMock.mockResolvedValue({ ok: true, openaiBatchId: 'batch_1', inputFileId: 'file_1' });
		const handler = fakeHandler({
			kind: 'missing_expiry',
			collect: vi
				.fn()
				.mockResolvedValue({ lines: [{ customId: 'missing_expiry:0', body: {} }], payload: { a: 1 } })
		});

		const summary = await runAiBatchCycle({ handlers: [handler], repository: repo, apiKey: 'sk-test' });

		expect(summary.submitted).toBe(1);
		expect(summary.submittedRequests).toBe(1);
		const job = repo.rows.find((r) => r.status === 'submitted');
		expect(job?.openaiBatchId).toBe('batch_1');
		expect(job?.payload).toEqual({ a: 1 });
	});

	it('does not submit again within the cadence window', async () => {
		const now = Date.UTC(2026, 6, 4, 12, 0, 0);
		const repo = new InMemoryRepo(() => now);
		repo.seed({ id: 'old', kind: 'missing_expiry', status: 'applied', createdAt: new Date(now - 60 * 60 * 1000) });
		const collect = vi.fn();
		const handler = fakeHandler({ kind: 'missing_expiry', minResubmitHours: 6, collect });

		const summary = await runAiBatchCycle({
			handlers: [handler],
			repository: repo,
			apiKey: 'sk-test',
			clock: () => now
		});

		expect(collect).not.toHaveBeenCalled();
		expect(summary.submitted).toBe(0);
	});

	it('polls a completed batch, applies output, and marks the job applied', async () => {
		const repo = new InMemoryRepo();
		repo.seed({
			id: 'job-1',
			kind: 'missing_expiry',
			status: 'submitted',
			openaiBatchId: 'batch_1',
			inputFileId: 'file_in',
			payload: { targets: {} }
		});
		pollBatchMock.mockResolvedValue({
			ok: true,
			rawStatus: 'completed',
			phase: 'completed',
			outputFileId: 'file_out',
			errorFileId: null,
			completed: 1,
			failed: 0,
			total: 1
		});
		fetchBatchOutputMock.mockResolvedValue([
			{ customId: 'missing_expiry:0', statusCode: 200, json: { estimates: [] }, text: '', error: null }
		]);
		const apply = vi.fn().mockResolvedValue({ applied: 3, result: { applied: 3 } });
		const handler = fakeHandler({ kind: 'missing_expiry', isEnabled: () => false, apply });

		const summary = await runAiBatchCycle({ handlers: [handler], repository: repo, apiKey: 'sk-test' });

		expect(apply).toHaveBeenCalledOnce();
		expect(summary.applied).toBe(3);
		const job = repo.rows.find((r) => r.id === 'job-1');
		expect(job?.status).toBe('applied');
		expect(job?.result).toEqual({ applied: 3 });
	});

	it('ages out a batch that never completes', async () => {
		const now = Date.UTC(2026, 6, 4, 12, 0, 0);
		const repo = new InMemoryRepo(() => now);
		repo.seed({
			id: 'stale',
			kind: 'admin_digest',
			status: 'submitted',
			openaiBatchId: 'batch_old',
			createdAt: new Date(now - 30 * 60 * 60 * 1000)
		});
		pollBatchMock.mockResolvedValue({
			ok: true,
			rawStatus: 'in_progress',
			phase: 'pending',
			outputFileId: null,
			errorFileId: null,
			completed: 0,
			failed: 0,
			total: 1
		});
		const handler = fakeHandler({ kind: 'admin_digest', isEnabled: () => false });

		const summary = await runAiBatchCycle({
			handlers: [handler],
			repository: repo,
			apiKey: 'sk-test',
			clock: () => now
		});

		expect(summary.expired).toBe(1);
		expect(repo.rows.find((r) => r.id === 'stale')?.status).toBe('expired');
	});
});
