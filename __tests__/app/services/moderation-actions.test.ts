jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
  adminPatch: jest.fn(),
}));

import { profileImages, reports, userReview } from '@/app/services/admin/moderation';
import { adminGet, adminPatch, adminPost } from '@/shared/lib/http/admin-fetch';

describe('moderation admin services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not require a JSON body for rank updates', async () => {
    (adminPatch as jest.Mock).mockResolvedValue(undefined);

    await expect(userReview.updateUserRank('user-1', 'A')).resolves.toBeUndefined();

    expect(adminPatch).toHaveBeenCalledWith('/admin/v2/profile-review/users/user-1/rank', {
      rank: 'A',
    });
  });

  it('does not require a JSON body for individual image approval', async () => {
    (adminPost as jest.Mock).mockResolvedValue(undefined);

    await expect(profileImages.approveIndividualImage('img-1')).resolves.toBeUndefined();

    expect(adminPost).toHaveBeenCalledWith('/admin/v2/profile-review/images/img-1/action', {
      action: 'approve',
    });
  });

  it('normalizes object-like review history names into strings', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: [
        {
          imageId: 'img-1',
          url: 'https://example.com/image.jpg',
          slotIndex: 0,
          isMain: true,
          reviewStatus: 'approved',
          reviewType: 'admin',
          reviewerName: { id: 'admin-1', name: '운영자A' },
          reviewedAt: '2026-04-05T00:00:00.000Z',
          reason: null,
          userId: 'user-1',
          userName: { id: 'user-1', name: '홍길동' },
          gender: 'MALE',
          age: 29,
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    await expect(userReview.getReviewHistory()).resolves.toEqual({
      items: [
        {
          imageId: 'img-1',
          imageUrl: 'https://example.com/image.jpg',
          slotIndex: 0,
          isMain: true,
          reviewStatus: 'approved',
          reviewType: 'admin',
          reviewedBy: '운영자A',
          reviewedAt: '2026-04-05T00:00:00.000Z',
          rejectionReason: null,
          user: {
            userId: 'user-1',
            name: '홍길동',
            gender: 'MALE',
            age: 29,
          },
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    });
  });

  it('sends the new report status payload contract for profile reports', async () => {
    (adminPatch as jest.Mock).mockResolvedValue({
      data: {
        success: true,
      },
    });

    await expect(
      reports.updateReportStatus('report-1', 'rejected', {
        type: 'profile',
        note: '운영 메모',
      }),
    ).resolves.toEqual({ success: true });

    expect(adminPatch).toHaveBeenCalledWith('/admin/v2/reports/report-1/status', {
      type: 'profile',
      status: 'dismissed',
      action: 'dismissed',
      note: '운영 메모',
    });
  });

  it('normalizes dismissed profile report statuses into rejected in list responses', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'report-1',
          reporterId: 'reporter-1',
          reporterName: '신고자A',
          reportedId: 'reported-1',
          reportedName: '피신고자A',
          reason: '허위 프로필',
          description: null,
          evidenceImages: [],
          status: 'DISMISSED',
          createdAt: '2026-04-15T12:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    const params = new URLSearchParams();
    const result = await reports.getProfileReports(params);

    expect(result.items[0]?.status).toBe('rejected');
  });

  it('normalizes dismissed profile report detail status into rejected', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: {
        id: 'report-1',
        status: 'dismissed',
        reason: '허위 프로필',
        createdAt: '2026-04-15T12:00:00.000Z',
      },
    });

    const result = await reports.getProfileReportDetail('report-1');

    expect(result.status).toBe('rejected');
  });

  it('normalizes report history items from the reports v2 endpoint', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'history-1',
          reportType: 'profile',
          reportId: 'report-1',
          reviewerId: 'admin-1',
          reviewerName: { id: 'admin-1', name: '운영자A' },
          previousStatus: 'reviewing',
          nextStatus: 'dismissed',
          action: 'dismissed',
          note: { id: 'memo-1', name: '허위 프로필 확인' },
          createdAt: '2026-04-15T12:00:00.000Z',
        },
      ],
    });

    await expect(reports.getProfileReportHistory('report-1')).resolves.toEqual([
      {
        id: 'history-1',
        reportType: 'profile',
        reportId: 'report-1',
        reviewerId: 'admin-1',
        reviewerName: '운영자A',
        previousStatus: 'reviewing',
        nextStatus: 'dismissed',
        action: 'dismissed',
        note: '허위 프로필 확인',
        createdAt: '2026-04-15T12:00:00.000Z',
      },
    ]);

    expect(adminGet).toHaveBeenCalledWith('/admin/v2/reports/report-1/history');
  });

  it('returns an empty report history when the backend history endpoint is unavailable', async () => {
    (adminGet as jest.Mock).mockRejectedValue(new Error('Not Found'));

    await expect(reports.getProfileReportHistory('report-1')).resolves.toEqual([]);
  });

  it('fetches cross-border reports with direction and status mapping and parses raw evidence JSON', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'cross-1',
          reporterSchema: 'kr',
          reporterUserId: 'kr-user-1',
          reporterName: '김민수',
          reportedSchema: 'jp',
          reportedUserId: 'jp-user-1',
          reportedName: 'サクラ',
          reason: '부적절한 언어 사용',
          evidence: JSON.stringify({
            evidenceKeys: ['report-evidence/jp-user-1/a.png'],
            description: 'LINE ID 요구 및 욕설',
          }),
          status: 'pending',
          reportedAt: '2026-11-20T10:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    const params = new URLSearchParams({
      page: '1',
      limit: '10',
      status: 'rejected',
      direction: 'kr_to_jp',
      urgent: 'true',
    });

    const result = await reports.getCrossBorderReports(params);

    expect(adminGet).toHaveBeenCalledWith(
      '/admin/v2/reports/cross-border?page=1&limit=10&status=dismissed&direction=kr_to_jp&urgent=true',
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'cross-1',
        type: 'cross_border',
        direction: 'kr_to_jp',
        sourceSchema: 'kr',
        status: 'pending',
        description: 'LINE ID 요구 및 욕설',
        evidenceImages: ['report-evidence/jp-user-1/a.png'],
        reporter: expect.objectContaining({ id: 'kr-user-1', name: '김민수', country: 'kr' }),
        reported: expect.objectContaining({ id: 'jp-user-1', name: 'サクラ', country: 'jp' }),
      }),
    );
  });

  it('sends cross-border report status updates to the dedicated endpoint', async () => {
    (adminPatch as jest.Mock).mockResolvedValue({
      data: { success: true, reportId: 'cross-1', status: 'resolved' },
    });

    await expect(
      reports.updateCrossBorderReportStatus('cross-1', 'resolved', {
        type: 'cross_border',
        action: 'suspended',
        suspendDays: 7,
        note: '일본 스키마 제재 완료',
      }),
    ).resolves.toEqual({ success: true, reportId: 'cross-1', status: 'resolved' });

    expect(adminPatch).toHaveBeenCalledWith('/admin/v2/reports/cross-border/cross-1/status', {
      type: 'cross_border',
      status: 'resolved',
      action: 'suspended',
      note: '일본 스키마 제재 완료',
      suspendDays: 7,
    });
  });

  it('passes x-country header for cross-border user profile images and chat history', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: { images: ['https://cdn.example/jp1.jpg'] },
    });

    await expect(reports.getUserProfileImages('jp-user-1', 'jp')).resolves.toEqual([
      'https://cdn.example/jp1.jpg',
    ]);
    expect(adminGet).toHaveBeenCalledWith(
      '/admin/v2/community/users/jp-user-1/profile-images',
      undefined,
      { headers: { 'x-country': 'jp' } },
    );

    (adminGet as jest.Mock).mockResolvedValue({
      data: { messages: [] },
    });
    await reports.getChatHistory('room-1', 1, 50, 'kr');
    expect(adminGet).toHaveBeenCalledWith(
      '/admin/v2/chat/rooms/room-1/messages',
      { page: '1', limit: '50' },
      { headers: { 'x-country': 'kr' } },
    );
  });

  it('extracts translatedDescription and descriptionLanguage from evidence JSON and prefers top-level fields', async () => {
    (adminGet as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 'cross-jp-1',
        reporterSchema: 'jp',
        reporterUserId: 'jp-user-1',
        reportedSchema: 'kr',
        reportedUserId: 'kr-user-1',
        reason: '불쾌감을 주는 표현',
        evidence: JSON.stringify({
          evidenceKeys: ['report-evidence/kr-user-1/1.png'],
          description: '初対面なのにLINEを強要されました',
          translatedDescription: '초면인데 LINE을 강요받았습니다',
          descriptionLanguage: 'ja',
        }),
        status: 'pending',
        reportedAt: '2026-11-21T01:00:00.000Z',
      },
    });

    const fromJson = await reports.getCrossBorderReportDetail('cross-jp-1');
    expect(fromJson.description).toBe('初対面なのにLINEを強要されました');
    expect(fromJson.translatedDescription).toBe('초면인데 LINE을 강요받았습니다');
    expect(fromJson.descriptionLanguage).toBe('ja');

    (adminGet as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 'cross-jp-2',
        reporterSchema: 'jp',
        reporterUserId: 'jp-user-2',
        reportedSchema: 'kr',
        reportedUserId: 'kr-user-2',
        reason: '부적절한 언어 사용',
        evidence: JSON.stringify({
          description: '暴言がありました',
          translatedDescription: '이전 번역',
        }),
        translatedDescription: '폭언이 있었습니다',
        descriptionLanguage: 'ja',
        status: 'pending',
        reportedAt: '2026-11-21T02:00:00.000Z',
      },
    });

    const fromTopLevel = await reports.getCrossBorderReportDetail('cross-jp-2');
    expect(fromTopLevel.translatedDescription).toBe('폭언이 있었습니다');
    expect(fromTopLevel.descriptionLanguage).toBe('ja');
  });
});
