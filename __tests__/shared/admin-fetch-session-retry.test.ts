import { adminGet } from '@/shared/lib/http/admin-fetch';
import { ADMIN_RETRY_HEADER, ADMIN_SESSION_EXPIRED_CODE } from '@/shared/auth/admin-auth-contract';

function fakeResponse(body: unknown, status: number) {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone: () => res,
  };
  return res;
}
const expired = () =>
  fakeResponse({ error: 'Not authenticated', code: ADMIN_SESSION_EXPIRED_CODE }, 401);
const ok = (body: unknown) => fakeResponse(body, 200);

describe('admin-fetch 세션 만료 재시도', () => {
  const assign = jest.fn();
  beforeEach(() => {
    jest.useFakeTimers();
    assign.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/admin/feature-flags', search: '?q=1', assign },
    });
  });
  afterEach(() => jest.useRealTimers());

  it('만료 응답을 받으면 재시도 헤더를 붙여 한 번 더 보내고 그 결과를 쓴다', async () => {
    // given
    const fetchMock = jest.fn().mockResolvedValueOnce(expired()).mockResolvedValueOnce(ok({ data: 1 }));
    global.fetch = fetchMock;

    // when
    const pending = adminGet<{ data: number }>('/admin/v2/feature-flags');
    await jest.advanceTimersByTimeAsync(400);
    const result = await pending;

    // then
    expect(result).toEqual({ data: 1 });
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get(ADMIN_RETRY_HEADER)).toBe('1');
    expect(assign).not.toHaveBeenCalled();
  });

  it('재시도도 만료면 지금 주소를 next 로 붙여 로그인 화면으로 보낸다', async () => {
    // given
    global.fetch = jest.fn().mockResolvedValueOnce(expired()).mockResolvedValueOnce(expired());

    // when
    const pending = adminGet('/admin/v2/feature-flags').catch((e) => e);
    await jest.advanceTimersByTimeAsync(400);
    await pending;

    // then
    expect(assign).toHaveBeenCalledWith(`/?next=${encodeURIComponent('/admin/feature-flags?q=1')}`);
  });
});
