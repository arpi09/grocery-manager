/**
 * Latency-insensitive AI jobs routed through the OpenAI Batch API (50% cheaper
 * on input+output). Kinds run from /api/cron/ai-batch — never on interactive
 * surfaces, which keep the synchronous Responses API path.
 */
export const AI_BATCH_KINDS = ['missing_expiry', 'expiry_push', 'admin_digest'] as const;

export type AiBatchKind = (typeof AI_BATCH_KINDS)[number];

/**
 * Lifecycle of a local ai_batch_job row.
 * - submitted: JSONL uploaded + batch created upstream, awaiting completion
 * - completed: upstream finished; output not yet applied to app state
 * - applied: results consumed (inventory written / bodies cached)
 * - failed:   upstream failed, or apply raised
 * - expired:  upstream 24h window elapsed without completion
 */
export const AI_BATCH_JOB_STATUSES = [
	'submitted',
	'completed',
	'applied',
	'failed',
	'expired'
] as const;

export type AiBatchJobStatus = (typeof AI_BATCH_JOB_STATUSES)[number];

export function isActiveAiBatchStatus(status: AiBatchJobStatus): boolean {
	return status === 'submitted' || status === 'completed';
}

/** Upstream OpenAI batch lifecycle (superset — we only branch on terminal-ness). */
export type OpenAiBatchStatus =
	| 'validating'
	| 'in_progress'
	| 'finalizing'
	| 'completed'
	| 'failed'
	| 'expired'
	| 'cancelling'
	| 'cancelled';

export function classifyOpenAiBatchStatus(
	status: string
): 'pending' | 'completed' | 'failed' | 'expired' {
	if (status === 'completed') return 'completed';
	if (status === 'expired') return 'expired';
	if (status === 'failed' || status === 'cancelled' || status === 'cancelling') return 'failed';
	return 'pending';
}

/** Stable per-line id within a batch; opaque to OpenAI, matched back on output. */
export function batchCustomId(kind: AiBatchKind, index: number): string {
	return `${kind}:${index}`;
}
