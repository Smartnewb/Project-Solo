/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@/shared/auth', () => ({
  getAdminAccessToken: jest.fn(),
  getSessionMeta: jest.fn(),
  getAdminRefreshToken: jest.fn(),
  setAdminAccessToken: jest.fn(),
  setAdminRefreshToken: jest.fn(),
  clearAdminCookies: jest.fn(),
  setSessionMeta: jest.fn(),
}));

import { GET } from '@/app/api/admin-proxy/[...path]/route';
import {
  clearAdminCookies,
  getAdminAccessToken,
  getAdminRefreshToken,
  getSessionMeta,
} from '@/shared/auth';
import { ADMIN_RETRY_HEADER, ADMIN_SESSION_EXPIRED_CODE } from '@/shared/auth/admin-auth-contract';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const DAY = 24 * 60 * 60 * 1000;
const futureAccessToken = 'header.eyJleHAiOjQxMDI0NDQ4MDB9.signature';
const meta = (issuedAt: number) => ({
  id: 'admin-1',
  email: 'admin@test.com',
  roles: ['admin'],
  issuedAt,
  selectedCountry: 'kr',
});

function backend(body: unknown, status = 200) {
  const headers = new Map([['content-type', 'application/json']]);
  return {
    ok: status >= 200 && status < 300,
    status,
    body: null,
    json: () => Promise.resolve(body),
    arrayBuffer: () => Promise.resolve(Buffer.from(JSON.stringify(body))),
    headers: {
      forEach: (cb: (value: string, key: string) => void) => headers.forEach(cb),
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
    },
  };
}

function call(headers: Record<string, string> = {}) {
  const req = new NextRequest(new URL('http://localhost:3000/api/admin-proxy/users'), { headers });
  return GET(req, { params: Promise.resolve({ path: ['users'] }) });
}

describe('admin-proxy 세션 갱신 실패', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminAccessToken as jest.Mock).mockResolvedValue(futureAccessToken);
    (getAdminRefreshToken as jest.Mock).mockResolvedValue('rotated-elsewhere');
    (getSessionMeta as jest.Mock).mockResolvedValue(meta(Date.now()));
  });

  it('첫 요청에서 갱신이 실패하면 쿠키를 지우지 않고 만료 코드를 돌려준다', async () => {
    // given
    mockFetch.mockResolvedValueOnce(backend({}, 401)).mockResolvedValueOnce(backend({}, 401));

    // when
    const res = await call();

    // then
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe(ADMIN_SESSION_EXPIRED_CODE);
    expect(clearAdminCookies).not.toHaveBeenCalled();
  });

  it('재시도 요청에서도 갱신이 실패하면 쿠키를 지운다', async () => {
    // given
    mockFetch.mockResolvedValueOnce(backend({}, 401)).mockResolvedValueOnce(backend({}, 401));

    // when
    const res = await call({ [ADMIN_RETRY_HEADER]: '1' });

    // then
    expect(res.status).toBe(401);
    expect(clearAdminCookies).toHaveBeenCalled();
  });

  it('7일이 지난 세션은 토큰이 남아 있어도 갱신해 쿠키 만료를 늦춘다', async () => {
    // given
    (getSessionMeta as jest.Mock).mockResolvedValue(meta(Date.now() - 8 * DAY));
    mockFetch
      .mockResolvedValueOnce(backend({ accessToken: futureAccessToken, refreshToken: 'next' }))
      .mockResolvedValueOnce(backend({ items: [] }));

    // when
    const res = await call();

    // then
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/auth/refresh'), expect.anything());
  });

  it('7일이 지난 세션의 갱신이 실패해도 남은 토큰으로 요청을 보낸다', async () => {
    // given
    (getSessionMeta as jest.Mock).mockResolvedValue(meta(Date.now() - 8 * DAY));
    mockFetch.mockResolvedValueOnce(backend({}, 401)).mockResolvedValueOnce(backend({ items: [] }));

    // when
    const res = await call();

    // then
    expect(res.status).toBe(200);
    expect(clearAdminCookies).not.toHaveBeenCalled();
  });
});
