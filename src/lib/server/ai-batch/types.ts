import type { AiBatchKind } from '$lib/domain/ai-batch';
import type { BatchOutputLine, BatchRequestLine } from '$lib/server/openai-batch';

export interface AiBatchCollectResult {
	lines: BatchRequestLine[];
	/** custom_id → target mapping (and any context) needed to apply results. */
	payload: Record<string, unknown>;
}

export interface AiBatchApplyResult {
	/** Count of effects landed (items written / bodies cached). */
	applied: number;
	/** jsonb cached on the job row for downstream consumers (null if none). */
	result: Record<string, unknown> | null;
}

/**
 * A latency-insensitive AI job that can run through the Batch API. Handlers own
 * the two edges — building request lines (`collect`) and consuming output
 * (`apply`) — while the runner owns submission, polling, and persistence.
 */
export interface AiBatchKindHandler {
	kind: AiBatchKind;
	/** Minimum hours between submissions for this kind (cadence guard). */
	minResubmitHours: number;
	isEnabled(): boolean;
	/** Gather pending work into request lines + payload, or null if nothing to do. */
	collect(apiKey: string): Promise<AiBatchCollectResult | null>;
	/** Consume completed output; returns a count + the jsonb to cache on the job. */
	apply(lines: BatchOutputLine[], payload: Record<string, unknown>): Promise<AiBatchApplyResult>;
}

/** A completed batch line is usable only on HTTP 200 with no upstream error. */
export function isUsableOutputLine(line: BatchOutputLine): boolean {
	return line.error === null && (line.statusCode === null || line.statusCode === 200);
}
