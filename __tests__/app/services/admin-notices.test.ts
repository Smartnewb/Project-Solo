jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
  adminPut: jest.fn(),
  adminDelete: jest.fn(),
}));

import { notices } from '@/app/services/admin/notices';
import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

describe('admin notices service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes backend v2 notice list responses to frontend list shape', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'notice-1',
          title: '공지',
          subtitle: null,
          categoryCode: 'notice',
          content: '<p>body</p>',
          priority: 'normal',
          status: 'published',
          expiresAt: null,
          linkUrl: 'https://example.com',
          hasReward: false,
          pushEnabled: false,
          pushTitle: null,
          pushMessage: null,
          publishedAt: '2026-05-05T00:00:00.000Z',
          pushSentAt: null,
          createdAt: '2026-05-05T00:00:00.000Z',
          updatedAt: '2026-05-05T00:00:00.000Z',
        },
      ],
      meta: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });

    await expect(notices.list({ page: 2, limit: 10 })).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 'notice-1',
          linkUrl: 'https://example.com',
          url: 'https://example.com',
        }),
      ],
      meta: { page: 2, limit: 10, totalItems: 21, totalPages: 3 },
    });
  });

  it('sends linkUrl as the canonical create field and keeps the url alias on response', async () => {
    (adminPost as jest.Mock).mockResolvedValue({
      data: {
        id: 'notice-2',
        title: '공지',
        subtitle: null,
        categoryCode: 'notice',
        content: '<p>body</p>',
        priority: 'high',
        status: 'draft',
        expiresAt: null,
        linkUrl: 'https://example.com/link',
        hasReward: false,
        pushEnabled: false,
        pushTitle: null,
        pushMessage: null,
        publishedAt: null,
        pushSentAt: null,
        createdAt: '2026-05-05T00:00:00.000Z',
        updatedAt: '2026-05-05T00:00:00.000Z',
      },
    });

    const payload = {
      title: '공지',
      subtitle: undefined,
      categoryCode: 'notice' as const,
      content: '<p>body</p>',
      priority: 'high' as const,
      expiresAt: null,
      linkUrl: 'https://example.com/link',
      hasReward: false,
      pushEnabled: false,
      pushTitle: null,
      pushMessage: null,
    };

    await expect(notices.create(payload)).resolves.toEqual(
      expect.objectContaining({
        linkUrl: 'https://example.com/link',
        url: 'https://example.com/link',
      }),
    );
    expect(adminPost).toHaveBeenCalledWith('/admin/v2/content/notices', payload);
  });
});
