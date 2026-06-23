/** Lightweight in-process circuit breaker after repeated OpenAI failures. */

const FAILURE_THRESHOLD = 5;
const WINDOW_MS = 60 * 60 * 1000;

let failureTimestamps: number[] = [];

function pruneOldFailures(now: number): void {
	const cutoff = now - WINDOW_MS;
	failureTimestamps = failureTimestamps.filter((ts) => ts >= cutoff);
}

export function recordOpenAiFailure(now: number = Date.now()): void {
	pruneOldFailures(now);
	failureTimestamps.push(now);
}

export function recordOpenAiSuccess(now: number = Date.now()): void {
	pruneOldFailures(now);
}

export function isOpenAiDegradedMode(now: number = Date.now()): boolean {
	pruneOldFailures(now);
	return failureTimestamps.length >= FAILURE_THRESHOLD;
}

/** Test helper — reset breaker state. */
export function resetOpenAiCircuitBreakerForTests(): void {
	failureTimestamps = [];
}
