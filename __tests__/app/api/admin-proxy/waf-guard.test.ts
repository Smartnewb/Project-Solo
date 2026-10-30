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

const LAMBDA_URL = 'https://abc.lambda-url.ap-northeast-2.on.aws/';
process.env.WAF_GUARD_ADMIN_URL = LAMBDA_URL;

import { GET } from '@/app/api/admin-proxy/[...path]/route';
import { getAdminAccessToken, getAdminRefreshToken, getSessionMeta } from '@/shared/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;
const token = 'header.eyJleHAiOjQxMDI0NDQ4MDB9.signature';

const call = (path: string[]) =>
  GET(new NextRequest(`http://localhost:3000/api/admin-proxy/${path.join('/')}`), {
    params: Promise.resolve({ path }),
  });

describe('admin-proxy waf-guard 경로', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminAccessToken as jest.Mock).mockResolvedValue(token);
    (getAdminRefreshToken as jest.Mock).mockResolvedValue(null);
    (getSessionMeta as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      roles: ['admin'],
      issuedAt: Date.now(),
      selectedCountry: 'kr',
    });
  });

  it('waf-guard/ips 는 API 가 아니라 Lambda 함수 URL 로 관리자 토큰과 함께 보낸다', async () => {
    // given
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ rows: [] }),
      arrayBuffer: () => Promise.resolve(Buffer.from('{"rows":[]}')),
      headers: { forEach: () => {}, get: () => 'application/json' },
    });

    // when
    await call(['waf-guard', 'ips']);

    // then
    expect(mockFetch).toHaveBeenCalledWith(
      `${LAMBDA_URL}ips`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
      }),
    );
  });

  it('waf-guard 아래라도 /ips 밖으로 나가는 경로는 막는다', async () => {
    // given — %2e%2e 는 new URL() 에서 .. 로 접힌다

    // when
    const res = await call(['waf-guard', '%2e%2e', 'admin']);

    // then
    expect(res.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
