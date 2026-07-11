import { NextRequest, NextResponse } from 'next/server';
import {
	clearAdminCookies,
	getAdminAccessToken,
	getAdminRefreshToken,
	getSessionMeta,
	setAdminAccessToken,
	setAdminRefreshToken,
	setSessionMeta,
	type AdminSessionMeta,
} from '@/shared/auth';
import { adminLog } from '@/shared/lib/admin-logger';
import { isSameOrigin } from '@/shared/lib/csrf';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';
const BACKEND_BASE_PATH = new URL(BACKEND_URL).pathname.replace(/\/$/, '');

const PROACTIVE_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ALLOWED_PATH_PREFIXES = [
	'admin/',
	'auth/',
	'users/',
	'user-gems/',
	'user-reports/',
	'user-appearance/',
	'universities/',
	'articles/',
	'public-reviews/',
	'app-reviews/',
	'stats/',
	'reports/',
	'dashboard/',
	'revenue/',
	'matching/',
	'support-chat/',
	'v4/admin/',
	'v1/admin/',
	'v1/gem/',
	'utm/',
	'go/',
];

function isPathAllowed(targetPath: string): boolean {
	// 1-4: Fast-reject literal ".." segments that arrive already decoded by the
	// router. This is NOT a complete traversal defense on its own:
	// percent-encoded dots ("%2e%2e") survive as a literal string here and only
	// collapse after URL construction, so the authoritative check runs after
	// `new URL()` normalizes the backend URL (see isBackendPathWithinBoundary).
	if (/(^|\/)\.\.(\/|$)/.test(targetPath)) {
		return false;
	}
	return ALLOWED_PATH_PREFIXES.some(
		(prefix) => targetPath === prefix.replace(/\/$/, '') || targetPath.startsWith(prefix),
	);
}

function isBackendPathWithinBoundary(url: URL): boolean {
	const normalized = url.pathname;
	const base = BACKEND_BASE_PATH;
	// The normalized path must stay under the backend base path (e.g. "/api").
	if (base && normalized !== base && !normalized.startsWith(`${base}/`)) {
		return false;
	}
	const remaining =
		base && normalized.startsWith(`${base}/`)
			? normalized.slice(base.length + 1)
			: normalized.replace(/^\//, '');
	// After normalization ".." is gone; re-applying the allowlist confirms the
	// resolved path still maps to an allowed backend route.
	return remaining.length > 0 && isPathAllowed(remaining);
}

function decodeJwtPayload(token: string): { exp?: number } | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = parts[1];
		const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
		const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
		const decoded = atob(padded);
		return JSON.parse(decoded);
	} catch {
		return null;
	}
}

function isTokenExpiringSoon(token: string): boolean {
	const payload = decodeJwtPayload(token);
	if (!payload?.exp) return true;
	return payload.exp * 1000 - Date.now() < PROACTIVE_REFRESH_THRESHOLD_MS;
}

const inFlightRefreshes = new Map<string, Promise<string | null>>();

type AdminProxyRouteParams = {
	path?: string[];
};

type AdminProxyRouteContext = {
	params?: AdminProxyRouteParams | Promise<AdminProxyRouteParams>;
};

async function resolveTargetPath(context: AdminProxyRouteContext): Promise<string | null> {
	const params = await context.params;
	if (!Array.isArray(params?.path) || params.path.length === 0) {
		return null;
	}
	return params.path.join('/');
}

async function doRefresh(meta: AdminSessionMeta, refreshToken: string): Promise<string | null> {
	try {
		const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-country': meta.selectedCountry,
			},
			body: JSON.stringify({ refreshToken }),
		});

		if (!res.ok) {
			await clearAdminCookies();
			return null;
		}

		const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
		if (!data.accessToken) {
			await clearAdminCookies();
			return null;
		}

		await setAdminAccessToken(data.accessToken);
		if (typeof data.refreshToken === 'string' && data.refreshToken.length > 0) {
			await setAdminRefreshToken(data.refreshToken);
		}
		await setSessionMeta({ ...meta, issuedAt: Date.now() });
		return data.accessToken;
	} catch (error) {
		adminLog.error('/api/admin-proxy', 'refresh_failed', error);
		return null;
	}
}

async function refreshAccessToken(meta: AdminSessionMeta | null): Promise<string | null> {
	const refreshToken = await getAdminRefreshToken();
	if (!refreshToken || !meta) {
		return null;
	}

	const dedupKey = `${meta.id}:${refreshToken}`;
	const existing = inFlightRefreshes.get(dedupKey);
	if (existing) {
		return existing;
	}

	const pending = doRefresh(meta, refreshToken).finally(() => {
		inFlightRefreshes.delete(dedupKey);
	});
	inFlightRefreshes.set(dedupKey, pending);
	return pending;
}

async function callBackend(
	url: string,
	method: string,
	body: BodyInit | null,
	token: string,
	meta: AdminSessionMeta | null,
	contentType: string | null,
	extraHeaders?: Record<string, string>,
): Promise<Response> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
	};
	if (contentType) headers['Content-Type'] = contentType;
	if (meta?.selectedCountry) headers['x-country'] = meta.selectedCountry;
	if (extraHeaders) {
		for (const [key, value] of Object.entries(extraHeaders)) {
			headers[key] = value;
		}
	}

	return fetch(url, { method, headers, body });
}

async function proxyRequest(request: NextRequest, context: AdminProxyRouteContext) {
	let token = await getAdminAccessToken();
	const meta = await getSessionMeta();

	const targetPath = await resolveTargetPath(context);
	if (!targetPath) {
		return NextResponse.json({ error: 'Bad request' }, { status: 400 });
	}

	if (!isPathAllowed(targetPath)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	// 1-4: CSRF guard. State-changing methods must originate from the same
	// origin. Browsers always send an Origin/Referer header on these methods,
	// so a missing/mismatched header means a forged request → fail-closed.
	if (MUTATION_METHODS.has(request.method) && !isSameOrigin(request)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	// 1-3: Defense-in-depth admin guard. sometimes-api enforces @Roles(ADMIN)
	// on admin/* routes, but several allowlist prefixes (matching/, stats/,
	// articles/, support-chat/, …) map to user-facing controllers that accept
	// non-admin tokens. The proxy cannot rely on the backend alone, so require
	// the session meta to carry the admin role before forwarding any request.
	if (!meta || !Array.isArray(meta.roles) || !meta.roles.includes('admin')) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	if (!token && targetPath !== 'auth/refresh') {
		token = await refreshAccessToken(meta);
	}

	if (!token) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Proactive refresh: if token expires within 5 minutes, refresh before making the request
	if (targetPath !== 'auth/refresh' && isTokenExpiringSoon(token)) {
		const newToken = await refreshAccessToken(meta);
		if (newToken) {
			token = newToken;
		}
	}

	const url = new URL(`${BACKEND_URL}/${targetPath}`);

	// 1-4: Defense-in-depth. `new URL()` decodes %2e%2e -> ".." and collapses
	// it, so a path that cleared the allowlist pre-check can still resolve
	// outside the backend base path (e.g. admin/%2e%2e/%2e%2e/secret -> /secret).
	// Verify the normalized pathname stays in-bounds before forwarding.
	if (!isBackendPathWithinBoundary(url)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	request.nextUrl.searchParams.forEach((value, key) => {
		url.searchParams.set(key, value);
	});

	const contentType = request.headers.get('content-type');
	const idempotencyKey = request.headers.get('idempotency-key');
	const extraHeaders: Record<string, string> = {};
	if (idempotencyKey) extraHeaders['idempotency-key'] = idempotencyKey;

	let body: BodyInit | null = null;
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		body = await request.arrayBuffer();
	}

	let backendRes = await callBackend(
		url.toString(),
		request.method,
		body,
		token,
		meta,
		contentType,
		extraHeaders,
	);

	if (backendRes.status === 401 && targetPath !== 'auth/refresh') {
		const newToken = await refreshAccessToken(meta);
		if (newToken) {
			backendRes = await callBackend(
				url.toString(),
				request.method,
				body,
				newToken,
				meta,
				contentType,
				extraHeaders,
			);
		}
	}

	const responseHeaders = new Headers();
	backendRes.headers.forEach((value, key) => {
		const lower = key.toLowerCase();
		if (
			lower === 'transfer-encoding' ||
			lower === 'connection' ||
			lower === 'content-encoding' ||
			lower === 'content-length'
		) {
			return;
		}
		responseHeaders.set(key, value);
	});

	const backendContentType = backendRes.headers.get('content-type') ?? '';
	const isStream = backendContentType.includes('text/event-stream');

	if (isStream && backendRes.body) {
		responseHeaders.set('cache-control', 'no-cache, no-transform');
		responseHeaders.set('x-accel-buffering', 'no');
		return new NextResponse(backendRes.body, {
			status: backendRes.status,
			headers: responseHeaders,
		});
	}

	const responseBody = await backendRes.arrayBuffer();
	const resBody = backendRes.status === 204 ? null : responseBody;

	return new NextResponse(resBody, {
		status: backendRes.status,
		headers: responseHeaders,
	});
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
