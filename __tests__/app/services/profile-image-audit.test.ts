import AdminService, { profileImageAudit } from '@/app/services/admin';
import { blacklist } from '@/app/services/admin/blacklist';
import { profileImages } from '@/app/services/admin/moderation';
import {
  profileImageAuditBulkActionFixture,
  profileImageAuditItemFixture,
  profileImageAuditListFixture,
} from './fixtures/profile-image-audit';

const originalFetch = global.fetch;
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

function jsonResponse(body: unknown): Response {
  return Object.assign(new Response(), {
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe('profile image audit service boundaries', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    window.fetch = fetchMock;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    window.fetch = originalFetch;
  });

  it('keeps the existing individual image approval wrapper behind admin proxy', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { success: true } }));

    await expect(profileImages.approveIndividualImage('image-1')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin-proxy/admin/v2/profile-review/images/image-1/action',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      },
    );
  });

  it('keeps the existing blacklist registration wrapper behind admin proxy', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          success: true,
          userId: 'user-1',
          blacklist: {
            id: 'blacklist-1',
            reason: '부적절한 프로필 이미지',
            blacklistedAt: '2026-06-15T00:00:00.000Z',
            blacklistedBy: 'admin-1',
          },
        },
      }),
    );

    await expect(
      blacklist.register('user-1', {
        reason: '부적절한 프로필 이미지',
        memo: 'profile-image-1 확인 필요',
      }),
    ).resolves.toEqual({
      data: {
        success: true,
        userId: 'user-1',
        blacklist: {
          id: 'blacklist-1',
          reason: '부적절한 프로필 이미지',
          blacklistedAt: '2026-06-15T00:00:00.000Z',
          blacklistedBy: 'admin-1',
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin-proxy/admin/v2/users/user-1/blacklist',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: '부적절한 프로필 이미지',
          memo: 'profile-image-1 확인 필요',
        }),
      },
    );
  });

  it('registers the profile image audit service as a named export and default AdminService member', () => {
    expect(AdminService.profileImageAudit).toBe(profileImageAudit);
  });

  it('lists approved profile images through the admin proxy with a 16-card default request', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(profileImageAuditListFixture));

    await expect(profileImageAudit.list({ limit: 16 })).resolves.toEqual(
      profileImageAuditListFixture,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin-proxy/admin/v2/profile-image-audit/images?limit=16',
      {
        method: 'GET',
        headers: undefined,
        body: undefined,
      },
    );
  });

  it('keeps backend-shaped card fields for report and sibling image summaries', () => {
    expect(profileImageAuditItemFixture).toMatchObject({
      hasReport: true,
      siblingImages: [
        {
          profileImageId: 'profile-image-1',
          imageId: 'image-1',
          thumbnailUrl: 'https://cdn.example.com/profile-image-1-thumb.jpg',
        },
        {
          profileImageId: 'profile-image-2',
          imageId: 'image-2',
          thumbnailUrl: 'https://cdn.example.com/profile-image-2-thumb.jpg',
        },
      ],
    });
  });

  it('serializes optional list params without sending blank filters', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(profileImageAuditListFixture));

    await profileImageAudit.list({
      limit: 16,
      search: '',
      includeSuspended: false,
      gender: undefined,
    });

    const call = fetchMock.mock.calls.at(0);
    if (!call) {
      throw new Error('profile image audit list did not call fetch');
    }
    const url = String(call[0]);
    const query = new URLSearchParams(url.split('?')[1] ?? '');

    expect(query.get('limit')).toBe('16');
    expect(query.get('includeSuspended')).toBe('false');
    expect(query.has('search')).toBe(false);
    expect(query.has('gender')).toBe(false);
  });

  it('calls all bulk profile image audit endpoints with backend-shaped payloads', async () => {
    fetchMock.mockResolvedValue(jsonResponse(profileImageAuditBulkActionFixture));

    await expect(
      profileImageAudit.bulkMarkOk({ profileImageIds: ['profile-image-1'] }),
    ).resolves.toEqual(profileImageAuditBulkActionFixture);
    await expect(
      profileImageAudit.bulkFlagSecondReview({
        profileImageIds: ['profile-image-1'],
        memo: 'ambiguous image',
      }),
    ).resolves.toEqual(profileImageAuditBulkActionFixture);
    await expect(
      profileImageAudit.bulkReject({
        profileImageIds: ['profile-image-1'],
        reason: '더 원활한 매칭을 위해 사진을 변경해주세요!',
      }),
    ).resolves.toEqual(profileImageAuditBulkActionFixture);
    await expect(
      profileImageAudit.bulkDelete({
        profileImageIds: ['profile-image-1'],
        reason: 'severe violation',
      }),
    ).resolves.toEqual(profileImageAuditBulkActionFixture);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/admin-proxy/admin/v2/profile-image-audit/images/bulk-mark-ok',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageIds: ['profile-image-1'] }),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/admin-proxy/admin/v2/profile-image-audit/images/bulk-flag-second-review',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileImageIds: ['profile-image-1'],
          memo: 'ambiguous image',
        }),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/admin-proxy/admin/v2/profile-image-audit/images/bulk-reject',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileImageIds: ['profile-image-1'],
          reason: '더 원활한 매칭을 위해 사진을 변경해주세요!',
        }),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/admin-proxy/admin/v2/profile-image-audit/images/bulk-delete',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileImageIds: ['profile-image-1'],
          reason: 'severe violation',
        }),
      },
    );
  });

  it('keeps an empty id selection explicit in bulk mark OK payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          requested: 0,
          succeeded: 0,
          failed: 0,
          results: [],
        },
      }),
    );

    await profileImageAudit.bulkMarkOk({ profileImageIds: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin-proxy/admin/v2/profile-image-audit/images/bulk-mark-ok',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageIds: [] }),
      },
    );
  });

  it('builds blacklist handoff metadata from selected image audit items', () => {
    expect(
      profileImageAudit.buildBlacklistHandoff([profileImageAuditItemFixture]),
    ).toEqual({
      userId: 'user-1',
      reason: '부적절한 프로필 이미지',
      memo: [
        '프로필 이미지 감사에서 블랙리스트 검토로 전달됨',
        'profileImageIds: profile-image-1',
        'imageUrls: https://cdn.example.com/profile-image-1.jpg',
      ].join('\n'),
      profileImageIds: ['profile-image-1'],
      imageUrls: ['https://cdn.example.com/profile-image-1.jpg'],
    });
  });
});
