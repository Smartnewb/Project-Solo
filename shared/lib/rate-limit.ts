// In-memory sliding-window rate limiter for BFF routes.
// NOTE: per-instance on serverless — a floor, not a hard global cap.
const buckets = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
	allowed: boolean;
	retryAfterSeconds: number;
}

export function checkRateLimit(
	key: string,
	{ windowMs, max }: { windowMs: number; max: number },
): RateLimitResult {
	// Deterministic behavior under jest — rate limiting stays a prod concern.
	if (process.env.NODE_ENV === 'test') {
		return { allowed: true, retryAfterSeconds: 0 };
	}
	const now = Date.now();
	const cutoff = now - windowMs;

	// Opportunistic cleanup so the map can't grow unboundedly.
	if (buckets.size > MAX_TRACKED_KEYS) {
		for (const [k, hits] of buckets) {
			const live = hits.filter((t) => t > cutoff);
			if (live.length === 0) buckets.delete(k);
			else buckets.set(k, live);
		}
		if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();
	}

	const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
	if (hits.length >= max) {
		return {
			allowed: false,
			retryAfterSeconds: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)),
		};
	}
	hits.push(now);
	buckets.set(key, hits);
	return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(headers: Headers): string {
	const forwarded = headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();
	return headers.get('x-real-ip') ?? 'unknown';
}
