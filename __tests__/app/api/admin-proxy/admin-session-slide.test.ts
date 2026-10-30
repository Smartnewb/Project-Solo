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
  getAdminAccessToken,
  getAdminRefreshToken,
  getSessionMeta,
  setAdminAccessToken,
} from '@/shared/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const nowSeconds = () => Math.floor(Date.now() / 1000);
const tokenWith = (payload: Record<string, unknown>) =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;
const okJson = (body: unknown) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body),
  arrayBuffer: () => Promise.resolve(Buffer.from(JSON.stringify(body))),
  headers: { forEach: () => {}, get: () => 'application/json' },
});
const call = () =>
  GET(new NextRequest('http://localhost:3000/api/admin-proxy/admin/v2/users'), {
    params: Promise.resolve({ path: ['admin', 'v2', 'users'] }),
  });

describe('번호 로그인 관리자 세션 연장', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
    (getSessionMeta as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      roles: ['admin'],
      issuedAt: Date.now(),
      selectedCountry: 'kr',
    });
  });

  it('번호 로그인 토큰이 발급된 지 1시간이 넘으면 요청 전에 갱신해 세션을 늘린다', async () => {
    // given
    (getAdminAccessToken as jest.Mock).mockResolvedValue(
      tokenWith({ adminOtp: true, iat: nowSeconds() - 2 * 3600, exp: nowSeconds() + 10 * 3600 }),
    );
    mockFetch
      .mockResolvedValueOnce(okJson({ accessToken: 'new-access', refreshToken: 'new-refresh' }))
      .mockResolvedValueOnce(okJson({ items: [] }));

    // when
    await call();

    // then
    expect(mockFetch.mock.calls[0][0]).toContain('/auth/refresh');
    expect(setAdminAccessToken).toHaveBeenCalledWith('new-access');
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe('Bearer new-access');
  });

  it('발급된 지 1시간이 안 된 토큰은 갱신하지 않는다', async () => {
    // given
    (getAdminAccessToken as jest.Mock).mockResolvedValue(
      tokenWith({ adminOtp: true, iat: nowSeconds() - 600, exp: nowSeconds() + 11 * 3600 }),
    );
    mockFetch.mockResolvedValueOnce(okJson({ items: [] }));

    // when
    await call();

    // then
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).not.toContain('/auth/refresh');
  });
});
