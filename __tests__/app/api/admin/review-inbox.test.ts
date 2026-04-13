/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('next/headers', () => ({ cookies: jest.fn() }));

jest.mock('@/shared/auth', () => ({
  getAdminAccessToken: jest.fn(),
  getSessionMeta: jest.fn(),
}));

import { GET } from '@/app/api/admin/review-inbox/route';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function createRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/review-inbox');
}

function makeBackendJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe('admin review inbox route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no admin access token exists', async () => {
    (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
    (getSessionMeta as jest.Mock).mockResolvedValue(null);

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Not authenticated');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('aggregates profile reports, community reports, and support-chat into the review inbox contract', async () => {
    (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
    (getSessionMeta as jest.Mock).mockResolvedValue({ selectedCountry: 'kr' });

    mockFetch
      .mockResolvedValueOnce(
        makeBackendJsonResponse({
          data: [
            {
              id: 'profile-pending-1',
              reporter: { id: 'r-1', name: '신고자A' },
              reported: { id: 'u-1', name: '피신고자A' },
              reason: '허위 프로필',
              description: '프로필 내용이 실제와 다릅니다.',
              evidenceImages: ['https://img.test/a.png'],
              status: 'PENDING',
              createdAt: '2026-04-15T09:00:00.000Z',
            },
          ],
          meta: { total: 1 },
        }),
      )
      .mockResolvedValueOnce(
        makeBackendJsonResponse({
          data: [
            {
              id: 'profile-reviewing-1',
              reporter: { id: 'r-2', name: '신고자B' },
              reported: { id: 'u-2', name: '피신고자B' },
              reason: '부적절한 사진',
              description: null,
              evidenceImages: [],
              status: 'REVIEWING',
              createdAt: '2026-04-15T08:00:00.000Z',
            },
          ],
          meta: { total: 1 },
        }),
      )
      .mockResolvedValueOnce(makeBackendJsonResponse({ data: [], meta: { total: 4 } }))
      .mockResolvedValueOnce(makeBackendJsonResponse({ data: [], meta: { total: 2 } }))
      .mockResolvedValueOnce(
        makeBackendJsonResponse({
          data: [
            {
              id: 'community-pending-1',
              reporter: { id: 'cr-1', name: '커뮤신고자' },
              reported: { id: 'cu-1', name: '커뮤피신고자' },
              article: { id: 'article-1', title: '테스트 게시글', content: '본문 미리보기' },
              reason: '욕설/혐오',
              description: '표현이 심합니다.',
              status: 'pending',
              createdAt: '2026-04-15T07:00:00.000Z',
            },
          ],
          meta: { total: 1 },
        }),
      )
      .mockResolvedValueOnce(makeBackendJsonResponse({ data: [], meta: { total: 0 } }))
      .mockResolvedValueOnce(makeBackendJsonResponse({ data: [], meta: { total: 5 } }))
      .mockResolvedValueOnce(makeBackendJsonResponse({ data: [], meta: { total: 1 } }))
      .mockResolvedValueOnce(
        makeBackendJsonResponse({
          sessions: [
            {
              sessionId: 'session-waiting-1',
              userId: 'user-1',
              userNickname: '민지',
              status: 'waiting_admin',
              language: 'ko',
              messageCount: 4,
              lastMessage: '환불이 안 들어왔어요',
              domain: 'payment',
              collectedInfo: { issueType: 'refund', paymentMethod: 'card' },
              createdAt: '2026-04-15T10:00:00.000Z',
            },
          ],
          pagination: { total: 1, page: 1, limit: 5, totalPages: 1 },
        }),
      )
      .mockResolvedValueOnce(
        makeBackendJsonResponse({
          sessions: [
            {
              sessionId: 'session-handling-1',
              userId: 'user-2',
              userNickname: '수진',
              status: 'admin_handling',
              language: 'ko',
              messageCount: 8,
              lastMessage: '상대방이 욕설을 했어요',
              domain: 'chat',
              collectedInfo: { issueType: 'abuse' },
              createdAt: '2026-04-15T06:00:00.000Z',
            },
          ],
          pagination: { total: 1, page: 1, limit: 5, totalPages: 1 },
        }),
      )
      .mockResolvedValueOnce(
        makeBackendJsonResponse({
          sessions: [],
          pagination: { total: 7, page: 1, limit: 1, totalPages: 7 },
        }),
      );

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({ approval: 2, judgment: 3, done: 19 });
    expect(body.buckets.approval.total).toBe(2);
    expect(body.buckets.judgment.total).toBe(3);
    expect(body.buckets.approval.items[0]).toMatchObject({
      sourceKind: 'profile_report',
      title: '피신고자A 프로필 신고',
      recommendation: '원본 화면에서 처리',
    });
    expect(body.buckets.approval.items[0].actions[0].href).toBe('/admin/reports?reportId=profile-pending-1');
    expect(body.buckets.approval.items[1].actions[0].href).toBe('/admin/community?tab=reports');
    expect(body.buckets.judgment.items[0]).toMatchObject({
      sourceKind: 'support_chat',
      recommendation: '세션 열기',
    });
    expect(body.buckets.judgment.items[0].actions[0].href).toBe('/admin/support-chat?session=session-waiting-1');
    expect(body.warnings).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(11);
  });
});
