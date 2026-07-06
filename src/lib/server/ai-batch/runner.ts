import { randomUUID } from 'node:crypto';
import type { AiBatchKind } from '$lib/domain/ai-batch';
import { estimateOpenAiBatchSpendUsd } from '$lib/domain/openai-budget';
import type { AiBatchJob, IAiBatchJobRepository } from '$lib/infrastructure/repositories/ai-batch-job.repository';
import {
	deleteBatchFiles,
	fetchBatchOutput,
	pollBatch,
	submitBatch
} from '$lib/server/openai-batch';
import type { AiBatchKindHandler } from './types';

/** A submitted batch older than this is aged out even if upstream still reports pending. */
const STALE_JOB_HOURS = 26;
/** Terminal jobs older than this are pruned. */
const CLEANUP_AGE_DAYS = 7;
const HOUR_MS = 60 * 60 * 1000;

export interface AiBatchRunSummary {
	polled: number;
	applied: number;
	submitted: number;
	submittedRequests: number;
	failed: number;
	expired: number;
	cleaned: number;
	estimatedUsd: number;
	byKind: Partial<Record<AiBatchKind, { submittedRequests: number; applied: number }>>;
	note?: string;
}

export interface AiBatchRunnerDeps {
	handlers: AiBatchKindHandler[];
	repository: IAiBatchJobRepository;
	apiKey: string | null;
	/** Injectable clock (ms) for tests. */
	clock?: () => number;
}

function emptySummary(): AiBatchRunSummary {
	return {
		polled: 0,
		applied: 0,
		submitted: 0,
		submittedRequests: 0,
		failed: 0,
		expired: 0,
		cleaned: 0,
		estimatedUsd: 0,
		byKind: {}
	};
}

function bumpKind(summary: AiBatchRunSummary, kind: AiBatchKind): { submittedRequests: number; applied: number } {
	summary.byKind[kind] ??= { submittedRequests: 0, applied: 0 };
	return summary.byKind[kind]!;
}

/**
 * One cron cycle: (1) poll in-flight batches and apply completed output,
 * (2) submit fresh batches per enabled kind (one in flight at a time, cadence
 * guarded), (3) prune old terminal rows. Safe to run repeatedly; all effects are
 * idempotent at the handler level.
 */
export async function runAiBatchCycle(deps: AiBatchRunnerDeps): Promise<AiBatchRunSummary> {
	const summary = emptySummary();
	const now = deps.clock ?? (() => Date.now());
	const apiKey = deps.apiKey;

	if (!apiKey) {
		summary.note = 'OPENAI_API_KEY missing — batch runner idle';
		return summary;
	}

	const handlerByKind = new Map<AiBatchKind, AiBatchKindHandler>(
		deps.handlers.map((handler) => [handler.kind, handler])
	);

	// 1. Poll + apply in-flight jobs.
	const active = await deps.repository.listActive();
	for (const job of active) {
		summary.polled += 1;
		try {
			await pollAndApply(job, handlerByKind.get(job.kind), deps, summary, now());
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`[ai-batch] job ${job.id} (${job.kind}) failed: ${message}`);
			if (ageHours(job.createdAt, now()) > STALE_JOB_HOURS) {
				await deps.repository.update(job.id, { status: 'failed', error: message.slice(0, 300) });
				summary.failed += 1;
			}
		}
	}

	// 2. Submit fresh batches per kind.
	for (const handler of deps.handlers) {
		try {
			await maybeSubmit(handler, deps, summary, now());
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`[ai-batch] submit ${handler.kind} failed: ${message}`);
		}
	}

	// 3. Prune old terminal rows.
	try {
		const cutoff = new Date(now() - CLEANUP_AGE_DAYS * 24 * HOUR_MS);
		summary.cleaned = await deps.repository.deleteOlderThan(cutoff);
	} catch (error) {
		console.error(`[ai-batch] cleanup failed: ${error instanceof Error ? error.message : error}`);
	}

	summary.estimatedUsd = estimateOpenAiBatchSpendUsd(
		Object.fromEntries(
			Object.entries(summary.byKind).map(([kind, stats]) => [kind, stats!.submittedRequests])
		) as Partial<Record<AiBatchKind, number>>
	);

	return summary;
}

async function pollAndApply(
	job: AiBatchJob,
	handler: AiBatchKindHandler | undefined,
	deps: AiBatchRunnerDeps,
	summary: AiBatchRunSummary,
	nowMs: number
): Promise<void> {
	const apiKey = deps.apiKey!;

	// Retry apply for a job already marked completed (apply previously threw).
	if (job.status === 'completed' && job.outputFileId) {
		await applyOutput(job, job.outputFileId, handler, deps, summary);
		return;
	}

	if (!job.openaiBatchId) {
		await deps.repository.update(job.id, { status: 'failed', error: 'missing upstream batch id' });
		summary.failed += 1;
		return;
	}

	const poll = await pollBatch(apiKey, job.openaiBatchId);
	if (!poll.ok || poll.phase === 'pending') {
		if (ageHours(job.createdAt, nowMs) > STALE_JOB_HOURS) {
			await deps.repository.update(job.id, {
				status: 'expired',
				error: poll.error ?? 'aged out before completion'
			});
			summary.expired += 1;
		}
		return;
	}

	if (poll.phase === 'failed') {
		await deps.repository.update(job.id, {
			status: 'failed',
			error: poll.error ?? `upstream status ${poll.rawStatus}`
		});
		summary.failed += 1;
		await deleteBatchFiles(apiKey, [job.inputFileId]);
		return;
	}

	if (poll.phase === 'expired') {
		await deps.repository.update(job.id, { status: 'expired', error: 'upstream expired' });
		summary.expired += 1;
		await deleteBatchFiles(apiKey, [job.inputFileId]);
		return;
	}

	// completed
	if (!poll.outputFileId) {
		await deps.repository.update(job.id, { status: 'failed', error: 'completed without output file' });
		summary.failed += 1;
		return;
	}
	await deps.repository.update(job.id, { status: 'completed', outputFileId: poll.outputFileId });
	await applyOutput({ ...job, outputFileId: poll.outputFileId }, poll.outputFileId, handler, deps, summary);
}

async function applyOutput(
	job: AiBatchJob,
	outputFileId: string,
	handler: AiBatchKindHandler | undefined,
	deps: AiBatchRunnerDeps,
	summary: AiBatchRunSummary
): Promise<void> {
	const apiKey = deps.apiKey!;
	if (!handler) {
		await deps.repository.update(job.id, { status: 'failed', error: `no handler for kind ${job.kind}` });
		summary.failed += 1;
		return;
	}

	const lines = await fetchBatchOutput(apiKey, outputFileId);
	const applyResult = await handler.apply(lines, job.payload);
	await deps.repository.update(job.id, { status: 'applied', result: applyResult.result });
	summary.applied += applyResult.applied;
	bumpKind(summary, job.kind).applied += applyResult.applied;
	await deleteBatchFiles(apiKey, [job.inputFileId, outputFileId]);
}

async function maybeSubmit(
	handler: AiBatchKindHandler,
	deps: AiBatchRunnerDeps,
	summary: AiBatchRunSummary,
	nowMs: number
): Promise<void> {
	const apiKey = deps.apiKey!;
	if (!handler.isEnabled()) return;

	// One batch in flight per kind.
	if ((await deps.repository.countActiveByKind(handler.kind)) > 0) return;

	// Cadence guard.
	const latest = await deps.repository.latestCreatedAt(handler.kind);
	if (latest && ageHours(latest, nowMs) < handler.minResubmitHours) return;

	const collected = await handler.collect(apiKey);
	if (!collected || collected.lines.length === 0) return;

	const submit = await submitBatch(apiKey, collected.lines);
	const id = randomUUID();
	if (!submit.ok) {
		await deps.repository.create({
			id,
			kind: handler.kind,
			status: 'failed',
			requestCount: collected.lines.length,
			payload: collected.payload,
			error: submit.error.slice(0, 300)
		});
		summary.failed += 1;
		return;
	}

	await deps.repository.create({
		id,
		kind: handler.kind,
		status: 'submitted',
		openaiBatchId: submit.openaiBatchId,
		inputFileId: submit.inputFileId,
		requestCount: collected.lines.length,
		payload: collected.payload
	});
	summary.submitted += 1;
	summary.submittedRequests += collected.lines.length;
	bumpKind(summary, handler.kind).submittedRequests += collected.lines.length;
}

function ageHours(from: Date, nowMs: number): number {
	return (nowMs - from.getTime()) / HOUR_MS;
}
