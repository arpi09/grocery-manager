type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Best-effort in-memory rate limit (per instance). */
export function consumeRateLimit(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	const entry = buckets.get(key);

	if (!entry || entry.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (entry.count >= max) {
		return false;
	}

	entry.count += 1;
	return true;
}

export function resetRateLimitsForTests(): void {
	buckets.clear();
}
