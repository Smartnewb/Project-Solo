import { NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta } from './cookies';
import type { AdminSessionMeta } from './session-config';
import { isAdminRoleSet } from './admin-session-user';

export type RequireAdminResult =
	| { ok: true; meta: AdminSessionMeta; token: string }
	| { ok: false; response: NextResponse };

/**
 * BFF route guard: requires a valid admin session AND an access-token cookie.
 * Mirrors the admin-proxy guard (meta.roles must include 'admin') so that a
 * planted unsigned `admin_access_token` cookie alone cannot reach the backend.
 */
export async function requireAdminRequest(): Promise<RequireAdminResult> {
	const meta = await getSessionMeta();
	if (!meta) {
		return {
			ok: false,
			response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
		};
	}
	if (!Array.isArray(meta.roles) || !isAdminRoleSet(meta.roles)) {
		return {
			ok: false,
			response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
		};
	}
	const token = await getAdminAccessToken();
	if (!token) {
		return {
			ok: false,
			response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
		};
	}
	return { ok: true, meta, token };
}
