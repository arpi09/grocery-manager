/**
 * OpenAI Batch API client (raw fetch, mirrors the sync Responses path).
 *
 * Flow: build a JSONL of /v1/responses requests → upload as a batch file →
 * create a batch → poll → download the output JSONL → parse. 50% cheaper on
 * input+output than synchronous calls, in exchange for a ≤24h completion window.
 * Used only by latency-insensitive cron jobs; interactive surfaces stay sync.
 */
import { extractResponseOutputText, safeParseModelJson } from '$lib/server/openai';
import { classifyOpenAiBatchStatus } from '$lib/domain/ai-batch';

const OPENAI_FILES_URL = 'https://api.openai.com/v1/files';
const OPENAI_BATCHES_URL = 'https://api.openai.com/v1/batches';
const RESPONSES_ENDPOINT = '/v1/responses';

/** One request line: the model body is a full /v1/responses payload. */
export interface BatchRequestLine {
	customId: string;
	body: Record<string, unknown>;
}

export type BatchSubmitResult =
	| { ok: true; openaiBatchId: string; inputFileId: string }
	| { ok: false; error: string };

export interface BatchPollResult {
	ok: boolean;
	rawStatus: string;
	phase: 'pending' | 'completed' | 'failed' | 'expired';
	outputFileId: string | null;
	errorFileId: string | null;
	completed: number;
	failed: number;
	total: number;
	error?: string;
}

export interface BatchOutputLine {
	customId: string;
	statusCode: number | null;
	/** Parsed strict-JSON output (for schema'd requests), else null. */
	json: unknown | null;
	/** Raw output_text (for freeform requests), else ''. */
	text: string;
	error: unknown | null;
}

function authHeaders(apiKey: string): Record<string, string> {
	return { Authorization: `Bearer ${apiKey}` };
}

export function buildBatchInputJsonl(lines: BatchRequestLine[]): string {
	return lines
		.map((line) =>
			JSON.stringify({
				custom_id: line.customId,
				method: 'POST',
				url: RESPONSES_ENDPOINT,
				body: line.body
			})
		)
		.join('\n');
}

/** Upload the JSONL, create the batch. Returns the upstream batch id. */
export async function submitBatch(
	apiKey: string,
	lines: BatchRequestLine[],
	completionWindow = '24h'
): Promise<BatchSubmitResult> {
	if (lines.length === 0) {
		return { ok: false, error: 'no request lines' };
	}

	let inputFileId: string;
	try {
		const jsonl = buildBatchInputJsonl(lines);
		const form = new FormData();
		form.append('purpose', 'batch');
		form.append('file', new Blob([jsonl], { type: 'application/jsonl' }), 'batch-input.jsonl');

		const fileResponse = await fetch(OPENAI_FILES_URL, {
			method: 'POST',
			headers: authHeaders(apiKey),
			body: form
		});
		if (!fileResponse.ok) {
			return { ok: false, error: `file upload ${fileResponse.status}: ${await safeErrorText(fileResponse)}` };
		}
		const filePayload = (await fileResponse.json()) as { id?: unknown };
		if (typeof filePayload.id !== 'string') {
			return { ok: false, error: 'file upload returned no id' };
		}
		inputFileId = filePayload.id;
	} catch (error) {
		return { ok: false, error: `file upload failed: ${messageOf(error)}` };
	}

	try {
		const batchResponse = await fetch(OPENAI_BATCHES_URL, {
			method: 'POST',
			headers: { ...authHeaders(apiKey), 'Content-Type': 'application/json' },
			body: JSON.stringify({
				input_file_id: inputFileId,
				endpoint: RESPONSES_ENDPOINT,
				completion_window: completionWindow
			})
		});
		if (!batchResponse.ok) {
			return { ok: false, error: `batch create ${batchResponse.status}: ${await safeErrorText(batchResponse)}` };
		}
		const batchPayload = (await batchResponse.json()) as { id?: unknown };
		if (typeof batchPayload.id !== 'string') {
			return { ok: false, error: 'batch create returned no id' };
		}
		return { ok: true, openaiBatchId: batchPayload.id, inputFileId };
	} catch (error) {
		return { ok: false, error: `batch create failed: ${messageOf(error)}` };
	}
}

export async function pollBatch(apiKey: string, openaiBatchId: string): Promise<BatchPollResult> {
	try {
		const response = await fetch(`${OPENAI_BATCHES_URL}/${openaiBatchId}`, {
			method: 'GET',
			headers: authHeaders(apiKey)
		});
		if (!response.ok) {
			return {
				ok: false,
				rawStatus: 'unknown',
				phase: 'pending',
				outputFileId: null,
				errorFileId: null,
				completed: 0,
				failed: 0,
				total: 0,
				error: `poll ${response.status}: ${await safeErrorText(response)}`
			};
		}
		const payload = (await response.json()) as {
			status?: unknown;
			output_file_id?: unknown;
			error_file_id?: unknown;
			request_counts?: { completed?: unknown; failed?: unknown; total?: unknown };
		};
		const rawStatus = typeof payload.status === 'string' ? payload.status : 'unknown';
		return {
			ok: true,
			rawStatus,
			phase: classifyOpenAiBatchStatus(rawStatus),
			outputFileId: typeof payload.output_file_id === 'string' ? payload.output_file_id : null,
			errorFileId: typeof payload.error_file_id === 'string' ? payload.error_file_id : null,
			completed: numberOf(payload.request_counts?.completed),
			failed: numberOf(payload.request_counts?.failed),
			total: numberOf(payload.request_counts?.total)
		};
	} catch (error) {
		return {
			ok: false,
			rawStatus: 'unknown',
			phase: 'pending',
			outputFileId: null,
			errorFileId: null,
			completed: 0,
			failed: 0,
			total: 0,
			error: `poll failed: ${messageOf(error)}`
		};
	}
}

/** Download + parse the output JSONL for a completed batch. */
export async function fetchBatchOutput(
	apiKey: string,
	outputFileId: string
): Promise<BatchOutputLine[]> {
	const response = await fetch(`${OPENAI_FILES_URL}/${outputFileId}/content`, {
		method: 'GET',
		headers: authHeaders(apiKey)
	});
	if (!response.ok) {
		throw new Error(`output download ${response.status}: ${await safeErrorText(response)}`);
	}
	const text = await response.text();
	return parseBatchOutputJsonl(text);
}

export function parseBatchOutputJsonl(jsonl: string): BatchOutputLine[] {
	const lines: BatchOutputLine[] = [];
	for (const raw of jsonl.split('\n')) {
		const trimmed = raw.trim();
		if (!trimmed) continue;
		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(trimmed) as Record<string, unknown>;
		} catch {
			continue;
		}
		const customId = typeof parsed.custom_id === 'string' ? parsed.custom_id : '';
		if (!customId) continue;

		const response = parsed.response as
			| { status_code?: unknown; body?: unknown }
			| null
			| undefined;
		const body = response?.body ?? null;
		const outputText = body ? extractResponseOutputText(body) : '';
		lines.push({
			customId,
			statusCode: typeof response?.status_code === 'number' ? response.status_code : null,
			json: outputText ? safeParseModelJson(outputText) : null,
			text: outputText,
			error: parsed.error ?? null
		});
	}
	return lines;
}

/** Best-effort cleanup of uploaded/output files after a batch is applied. */
export async function deleteBatchFiles(apiKey: string, fileIds: Array<string | null>): Promise<void> {
	for (const fileId of fileIds) {
		if (!fileId) continue;
		try {
			await fetch(`${OPENAI_FILES_URL}/${fileId}`, {
				method: 'DELETE',
				headers: authHeaders(apiKey)
			});
		} catch {
			// non-fatal: files expire on their own
		}
	}
}

async function safeErrorText(response: Response): Promise<string> {
	const text = await response.text().catch(() => '');
	return text.trim().slice(0, 300);
}

function messageOf(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function numberOf(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
