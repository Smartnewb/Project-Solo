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
});
