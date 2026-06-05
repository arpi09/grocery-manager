import type { RateLimitPort } from '$lib/application/ports/rate-limit.port';
import { consumeRateLimit } from '$lib/server/auth-rate-limit';

export const rateLimitAdapter: RateLimitPort = {
	consume: consumeRateLimit
};
