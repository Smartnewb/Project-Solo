import type { NextRequest } from 'next/server';

type SameOriginRequest = Pick<NextRequest, 'headers' | 'nextUrl'>;

function matchesRequestOrigin(value: string, requestOrigin: string): boolean {
	try {
		return new URL(value).origin === requestOrigin;
	} catch {
		// Malformed or cross-realm URL (next/server swaps the global URL) ⇒
		// cannot be same-origin. Catch broadly: new URL() is the only throwable.
		return false;
	}
}

export function isSameOrigin(request: SameOriginRequest): boolean {
	const requestOrigin = request.nextUrl.origin;
	const origin = request.headers.get('origin');
	if (origin) return matchesRequestOrigin(origin, requestOrigin);

	const referer = request.headers.get('referer');
	if (referer) return matchesRequestOrigin(referer, requestOrigin);

	return false; // fail-closed: a browser-issued same-origin mutation always
	// carries an Origin or Referer header; neither present ⇒ forged (CSRF).
}
