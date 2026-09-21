// Sliding-window rate limiter for BFF routes.
// Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL/_TOKEN are set —
// shared across serverless instances. Otherwise falls back to an in-memory
// per-instance limiter (a floor, not a hard global cap).
const buckets = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
	allowed: boolean;
	retryAfterSeconds: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function checkUpstashRateLimit(
	key: string,
	windowMs: number,
	max: number,
): Promise<RateLimitResult | null> {
	try {
		const res = await fetch(`${UPSTASH_URL}/pipeline`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${UPSTASH_TOKEN}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify([
				['INCR', key],
				['PEXPIRE', key, windowMs, 'NX'],
				['PTTL', key],
			]),
		});
		if (!res.ok) return null;
		const results = (await res.json()) as Array<{ result?: number }>;
		const count = Number(results[0]?.result ?? 0);
		const ttlMs = Number(results[2]?.result ?? windowMs);
		if (count > max) {
			return {
				allowed: false,
				retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
			};
		}
		return { allowed: true, retryAfterSeconds: 0 };
	} catch {
		return null; // fail open to the in-memory path on store errors
	}
}

function checkInMemoryRateLimit(
	key: string,
	windowMs: number,
	max: number,
): RateLimitResult {
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

export async function checkRateLimit(
	key: string,
	{ windowMs, max }: { windowMs: number; max: number },
): Promise<RateLimitResult> {
	// Deterministic behavior under jest — rate limiting stays a prod concern.
	if (process.env.NODE_ENV === 'test') {
		return { allowed: true, retryAfterSeconds: 0 };
	}
	if (UPSTASH_URL && UPSTASH_TOKEN) {
		const result = await checkUpstashRateLimit(key, windowMs, max);
		if (result) return result;
	}
	return checkInMemoryRateLimit(key, windowMs, max);
}

export function getClientIp(headers: Headers): string {
	const forwarded = headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();
	return headers.get('x-real-ip') ?? 'unknown';
}
