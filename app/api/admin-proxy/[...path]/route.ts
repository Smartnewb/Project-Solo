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
import {
	ADMIN_RETRY_HEADER,
	ADMIN_SESSION_EXPIRED_CODE,
} from '@/shared/auth/admin-auth-contract';
import { adminLog } from '@/shared/lib/admin-logger';
import { isSameOrigin } from '@/shared/lib/csrf';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';
const BACKEND_BASE_PATH = new URL(BACKEND_URL).pathname.replace(/\/$/, '');
// 의심 IP 대시보드는 API 가 아니라 waf-guard 어드민 Lambda(함수 URL)로 보낸다. Lambda 가 같은 관리자 토큰을 API 에 확인받는다.
const WAF_GUARD_PREFIX = 'waf-guard/';
const WAF_GUARD_ADMIN_URL = process.env.WAF_GUARD_ADMIN_URL;

const PROACTIVE_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
// 번호 로그인 관리자 세션은 갱신할 때마다 12시간씩 늘어난다(API auth.service adminOtpSessionWindow).
// 쓰는 동안 한 시간에 한 번 갱신해 두면 12시간을 쉬기 전에는 끊기지 않는다.
const ADMIN_SESSION_SLIDE_AFTER_MS = 60 * 60 * 1000;
// 쿠키 만료(30일)가 로그인 시점에 고정되지 않도록, 이보다 오래된 세션은 갱신해 쿠키를 다시 심는다.
const SESSION_SLIDE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
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
	WAF_GUARD_PREFIX,
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

function decodeJwtPayload(token: string): { exp?: number; iat?: number; adminOtp?: boolean } | null {
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

function shouldRefreshToken(token: string): boolean {
	const payload = decodeJwtPayload(token);
	if (!payload?.exp) return true;
	if (payload.exp * 1000 - Date.now() < PROACTIVE_REFRESH_THRESHOLD_MS) return true;
	return (
		payload.adminOtp === true &&
		typeof payload.iat === 'number' &&
		Date.now() - payload.iat * 1000 > ADMIN_SESSION_SLIDE_AFTER_MS
	);
}

const inFlightRefreshes = new Map<string, Promise<string | null>>();

type AdminProxyRouteParams = {
	path?: string[];
};

type AdminProxyRouteContext = {
	params: Promise<AdminProxyRouteParams>;
};

async function resolveTargetPath(context: AdminProxyRouteContext): Promise<string | null> {
	const params = await context.params;
	if (!Array.isArray(params?.path) || params.path.length === 0) {
		return null;
	}
	// Next 가 세그먼트를 디코딩해 주므로 URL 을 자르는 '#', '?' 만 다시 인코딩한다. 안 그러면 pk 의
	// '#'(REVIEW#APP_STORE#...)이 new URL() 에서 fragment 로 잘려 백엔드가 /app-reviews/REVIEW 로 받는다.
	// '%' 까지 인코딩하면 아래 %2e%2e 순회 방어가 달라지므로 건드리지 않는다.
	return params.path.map((s) => s.replace(/[#?]/g, encodeURIComponent)).join('/');
}

async function doRefresh(
	meta: AdminSessionMeta,
	refreshToken: string,
	clearOnFailure: boolean,
): Promise<string | null> {
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
			if (clearOnFailure) await clearAdminCookies();
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

async function refreshAccessToken(
	meta: AdminSessionMeta | null,
	clearOnFailure: boolean,
): Promise<string | null> {
	const refreshToken = await getAdminRefreshToken();
	if (!refreshToken || !meta) {
		return null;
	}

	const dedupKey = `${meta.id}:${refreshToken}`;
	const existing = inFlightRefreshes.get(dedupKey);
	if (existing) {
		return existing;
	}

	const pending = doRefresh(meta, refreshToken, clearOnFailure).finally(() => {
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

	// 백엔드는 refresh 토큰을 계정당 하나만 두고 갱신마다 바꾼다. 동시 요청 중 하나만 갱신에 성공하므로
	// 첫 실패에서 쿠키를 지우면 성공한 쪽의 새 쿠키까지 지워진다. 클라이언트 재시도에서만 지운다.
	const clearOnFailure = request.headers.get(ADMIN_RETRY_HEADER) === '1';
	const sessionExpired = () =>
		NextResponse.json(
			{ error: 'Not authenticated', code: ADMIN_SESSION_EXPIRED_CODE },
			{ status: 401 },
		);

	if (!token && targetPath !== 'auth/refresh') {
		token = await refreshAccessToken(meta, clearOnFailure);
	}

	if (!token) {
		return sessionExpired();
	}

	// Proactive refresh: if token expires within 5 minutes, refresh before making the request
	const sessionStale = Date.now() - (meta.issuedAt ?? 0) > SESSION_SLIDE_AFTER_MS;
	if (targetPath !== 'auth/refresh' && (shouldRefreshToken(token) || sessionStale)) {
		const newToken = await refreshAccessToken(meta, clearOnFailure);
		if (newToken) {
			token = newToken;
		}
	}

	const toWafGuard = targetPath.startsWith(WAF_GUARD_PREFIX);
	if (toWafGuard && !WAF_GUARD_ADMIN_URL) {
		return NextResponse.json({ error: 'WAF_GUARD_ADMIN_URL is not set' }, { status: 503 });
	}
	const url = toWafGuard
		? new URL(targetPath.slice(WAF_GUARD_PREFIX.length), WAF_GUARD_ADMIN_URL)
		: new URL(`${BACKEND_URL}/${targetPath}`);

	// 1-4: Defense-in-depth. `new URL()` decodes %2e%2e -> ".." and collapses
	// it, so a path that cleared the allowlist pre-check can still resolve
	// outside the backend base path (e.g. admin/%2e%2e/%2e%2e/secret -> /secret).
	// Verify the normalized pathname stays in-bounds before forwarding.
	if (toWafGuard ? !url.pathname.startsWith('/ips') : !isBackendPathWithinBoundary(url)) {
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
		const newToken = await refreshAccessToken(meta, clearOnFailure);
		if (!newToken) {
			return sessionExpired();
		}
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

// 웹방화벽 의심 IP 조회는 Logs Insights 를 기다려 10초를 넘긴다(2026-10-30 첫 호출 9.3초)
export const maxDuration = 60;

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
