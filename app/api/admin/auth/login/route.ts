import { NextRequest, NextResponse } from 'next/server';
import { adminLog } from '@/shared/lib/admin-logger';
import { checkRateLimit, getClientIp } from '@/shared/lib/rate-limit';
import {
  normalizeAdminCountry,
  setAdminAccessToken,
  setAdminRefreshToken,
  setSessionMeta,
} from '@/shared/auth';
import type { AdminSessionMeta } from '@/shared/auth';
import {
  buildAdminSessionUser,
  extractRoles,
  isAdminRoleSet,
  type AdminIdentitySource,
} from '@/shared/auth/admin-session-user';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

const ADMIN_OTP_MESSAGES: Record<string, string> = {
  'AUTH.ADMIN_OTP_REQUIRED': '1Password의 관리자 인증 번호 6자리를 입력해 주세요.',
  'AUTH.ADMIN_OTP_INVALID': '인증 번호가 맞지 않습니다. 새 번호로 다시 시도해 주세요.',
  'AUTH.ADMIN_OTP_LOCKED': '인증 번호를 여러 번 틀려 15분 동안 로그인할 수 없습니다.',
  'AUTH.ADMIN_OTP_NOT_ENROLLED': '인증 번호가 등록되지 않은 관리자 계정입니다. 운영자에게 등록을 요청해 주세요.',
  'AUTH.ADMIN_OTP_UNAVAILABLE': '지금은 관리자 인증 번호를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
};

async function readAdminOtpError(res: Response): Promise<{ code: string; message: string } | null> {
  try {
    const body = (await res.json()) as { code?: unknown } | null;
    const code = typeof body?.code === 'string' ? body.code : '';
    const message = ADMIN_OTP_MESSAGES[code];
    return message ? { code, message } : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const ipLimit = await checkRateLimit(`login:ip:${ip}`, { windowMs: 5 * 60 * 1000, max: 30 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
      );
    }

    const body = await request.json();
    const emailKey = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '';
    const emailLimit = await checkRateLimit(`login:acct:${ip}:${emailKey}`, {
      windowMs: 5 * 60 * 1000,
      max: 10,
    });
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts' },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds) } },
      );
    }

    const selectedCountry = normalizeAdminCountry(body.selectedCountry);

    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': selectedCountry,
      },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const otpError = await readAdminOtpError(backendRes);
      if (otpError) {
        return NextResponse.json({ error: otpError.message, code: otpError.code }, { status: 401 });
      }
      const status = backendRes.status === 401 ? 401 : 400;
      return NextResponse.json({ error: 'Invalid credentials' }, { status });
    }

    const data = await backendRes.json();

    const roles = extractRoles(data);
    if (!isAdminRoleSet(roles)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [userRes, detailsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/user`, {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
          'x-country': selectedCountry,
        },
      }),
      fetch(`${BACKEND_URL}/user/details`, {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
          'x-country': selectedCountry,
        },
      }),
    ]);

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch admin identity' }, { status: 502 });
    }

    const identity = (await userRes.json()) as AdminIdentitySource;
    const details = detailsRes.ok ? ((await detailsRes.json()) as AdminIdentitySource) : null;
    const sessionUser = buildAdminSessionUser(identity, details, body.email);

    await setAdminAccessToken(data.accessToken);
    if (typeof data.refreshToken === 'string' && data.refreshToken.length > 0) {
      await setAdminRefreshToken(data.refreshToken);
    }

    const meta: AdminSessionMeta = {
      id: sessionUser.id,
      email: sessionUser.email,
      roles: sessionUser.roles,
      issuedAt: Date.now(),
      selectedCountry,
    };
    await setSessionMeta(meta);

    return NextResponse.json({
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        roles: sessionUser.roles,
        role: sessionUser.roles[0] || 'admin',
      },
    });
  } catch (error) {
    adminLog.error('/api/admin/auth/login', 'login_failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
