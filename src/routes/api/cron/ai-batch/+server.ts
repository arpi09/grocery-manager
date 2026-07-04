import { json } from '@sveltejs/kit';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { isAiBatchEnabled } from '$lib/server/feature-flags';
import { getOpenAiApiKey } from '$lib/server/openai';
import { aiBatchHandlers, aiBatchJobRepository } from '$lib/server/di';
import { runAiBatchCycle } from '$lib/server/ai-batch/runner';
import type { RequestHandler } from './$types';

/**
 * Drives the OpenAI Batch API pipeline for latency-insensitive AI cron jobs:
 * polls in-flight batches + applies completed output, then submits fresh work
 * per enabled kind. Idempotent — safe to run on a schedule. Off by default
 * (AI_BATCH_ENABLED); interactive surfaces always use the synchronous path.
 */
export const POST: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	if (!isAiBatchEnabled()) {
		return json({ ok: true, skipped: 'AI_BATCH_ENABLED not set' });
	}

	const summary = await runAiBatchCycle({
		handlers: aiBatchHandlers,
		repository: aiBatchJobRepository,
		apiKey: getOpenAiApiKey()
	});

	return json({ ok: true, ...summary });
};
