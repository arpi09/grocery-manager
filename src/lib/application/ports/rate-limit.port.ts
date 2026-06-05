export interface RateLimitPort {
	consume(key: string, max: number, windowMs: number): boolean;
}
