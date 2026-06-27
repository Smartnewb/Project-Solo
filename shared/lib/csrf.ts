import type { NextRequest } from 'next/server';

type SameOriginRequest = Pick<NextRequest, 'headers' | 'nextUrl'>;

function matchesRequestOrigin(value: string, requestOrigin: string): boolean {
	try {
		return new URL(value).origin === requestOrigin;
	} catch (error) {
		if (error instanceof TypeError) return false;
		throw error;
	}
}

export function isSameOrigin(request: SameOriginRequest): boolean {
	const requestOrigin = request.nextUrl.origin;
	const origin = request.headers.get('origin');
	if (origin) return matchesRequestOrigin(origin, requestOrigin);

	const referer = request.headers.get('referer');
	if (referer) return matchesRequestOrigin(referer, requestOrigin);

	return true;
}
