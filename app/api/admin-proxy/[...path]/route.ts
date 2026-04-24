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

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

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
	'utm/',
	'go/',
];

function isPathAllowed(targetPath: string): boolean {
	return ALLOWED_PATH_PREFIXES.some(
		(prefix) => targetPath === prefix.replace(/\/$/, '') || targetPath.startsWith(prefix),
	);
}

const inFlightRefreshes = new Map<string, Promise<string | null>>();

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
): Promise<Response> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
	};
	if (contentType) headers['Content-Type'] = contentType;
	if (meta?.selectedCountry) headers['x-country'] = meta.selectedCountry;

	return fetch(url, { method, headers, body });
}

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
	let token = await getAdminAccessToken();
	const meta = await getSessionMeta();

	if (!token) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}

	const targetPath = params.path.join('/');

	if (!isPathAllowed(targetPath)) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	const url = new URL(`${BACKEND_URL}/${targetPath}`);

	request.nextUrl.searchParams.forEach((value, key) => {
		url.searchParams.set(key, value);
	});

	const contentType = request.headers.get('content-type');

	let body: BodyInit | null = null;
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		body = await request.arrayBuffer();
	}

	let backendRes = await callBackend(url.toString(), request.method, body, token, meta, contentType);

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
			);
		}
	}

	const responseHeaders = new Headers();
	backendRes.headers.forEach((value, key) => {
		const lower = key.toLowerCase();
		if (lower === 'transfer-encoding' || lower === 'connection') return;
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
