/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const getSessionMetaMock = jest.fn();
const adminLogErrorMock = jest.fn();

jest.mock('@/shared/auth', () => ({
  getSessionMeta: getSessionMetaMock,
}));

jest.mock('@/shared/lib/admin-logger', () => ({
  adminLog: {
    error: adminLogErrorMock,
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/error-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function loadPost() {
  let POST: (request: NextRequest) => Promise<Response>;

  await jest.isolateModulesAsync(async () => {
    ({ POST } = await import('@/app/api/admin/error-report/route'));
  });

  return POST!;
}

describe('POST /api/admin/error-report', () => {
  beforeEach(() => {
    jest.resetModules();
    getSessionMetaMock.mockReset();
    adminLogErrorMock.mockReset();
    mockFetch.mockReset();
    delete process.env.SLACK_WEBHOOK_URL;
  });

  it('returns 401 when session is missing', async () => {
    getSessionMetaMock.mockResolvedValue(null);

    const POST = await loadPost();
    const response = await POST(createRequest({ message: 'boom' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(adminLogErrorMock).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('logs the error but does not forward it to Slack even if a webhook is configured', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.example/services/test';
    getSessionMetaMock.mockResolvedValue({ id: 'admin-1' });
    mockFetch.mockResolvedValue({ ok: true });

    const POST = await loadPost();
    const response = await POST(
      createRequest({
        message: 'Cannot read properties of undefined',
        stack: 'TypeError: boom',
        componentStack: 'in AdminPage',
        url: 'https://project-solo-gray.vercel.app/admin/dashboard',
        timestamp: '2026-04-04T19:01:25.508Z',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(adminLogErrorMock).toHaveBeenCalledWith(
      '/api/admin/error-report',
      'client_error',
      expect.any(Error),
      expect.objectContaining({
        url: 'https://project-solo-gray.vercel.app/admin/dashboard',
        componentStack: 'in AdminPage',
      }),
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
