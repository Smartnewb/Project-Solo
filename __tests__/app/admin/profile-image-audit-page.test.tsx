import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ProfileImageAuditPage from '@/app/admin/profile-image-audit/profile-image-audit-v2';
import { profileImageAudit, userReview } from '@/app/services/admin';
import {
  profileImageAuditBulkActionFixture,
  profileImageAuditItemFixture,
  profileImageAuditListFixture,
} from '@/__tests__/app/services/fixtures/profile-image-audit';

jest.mock('@/app/services/admin', () => ({
  profileImageAudit: {
    list: jest.fn(),
    bulkMarkOk: jest.fn(),
    bulkReject: jest.fn(),
    bulkDelete: jest.fn(),
    buildBlacklistHandoff: jest.fn(),
  },
  userReview: {
    updateUserRank: jest.fn(),
  },
}));

const mockedAudit = profileImageAudit as jest.Mocked<typeof profileImageAudit>;
const mockedUserReview = userReview as jest.Mocked<typeof userReview>;

describe('ProfileImageAuditPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAudit.list.mockResolvedValue({
      ...profileImageAuditListFixture,
      data: [
        profileImageAuditItemFixture,
        {
          ...profileImageAuditItemFixture,
          profileImageId: 'profile-image-2',
          imageId: 'image-2',
          imageUrl: 'https://cdn.example.com/profile-image-2.jpg',
          thumbnailUrl: null,
          profileRank: 'B',
          age: 22,
          gender: 'MALE',
          universityName: '연세대학교',
          slotIndex: 1,
          isMain: false,
          hasReport: false,
        },
      ],
      meta: { page: 1, limit: 16, total: 2, totalPages: 1 },
    });
    mockedAudit.bulkMarkOk.mockResolvedValue(profileImageAuditBulkActionFixture);
    mockedAudit.bulkReject.mockResolvedValue(profileImageAuditBulkActionFixture);
    mockedAudit.bulkDelete.mockResolvedValue(profileImageAuditBulkActionFixture);
    mockedUserReview.updateUserRank.mockResolvedValue(undefined);
    mockedAudit.buildBlacklistHandoff.mockReturnValue({
      userId: 'user-1',
      reason: '부적절한 프로필 이미지',
      memo: 'profile-image-1',
      profileImageIds: ['profile-image-1'],
      imageUrls: ['https://cdn.example.com/profile-image-1.jpg'],
    });
  });

  it('renders image-centered audit cards and bulk actions', async () => {
    const user = userEvent.setup();

    render(<ProfileImageAuditPage />);

    expect(await screen.findByRole('heading', { level: 1, name: '프로필 이미지 전수검사' })).toBeInTheDocument();
    expect(mockedAudit.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 16, auditStatus: 'unreviewed' }),
    );
    expect(screen.getByText('서울대학교')).toBeInTheDocument();
    expect(screen.getByText('24세 · 여성')).toBeInTheDocument();
    expect(screen.getByText('등급 A')).toBeInTheDocument();
    expect(screen.getByText('연세대학교')).toBeInTheDocument();
    expect(screen.getByText('등급 B')).toBeInTheDocument();
    expect(screen.getByAltText('profile-image-1 프로필 이미지')).toHaveAttribute(
      'src',
      'https://cdn.example.com/profile-image-1.jpg',
    );

    await user.click(screen.getByRole('button', { name: 'profile-image-1 크게 보기' }));
    expect(screen.getByAltText('profile-image-1 프로필 이미지 크게 보기')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '큰 이미지 닫기' }));
    await waitFor(() => {
      expect(screen.queryByAltText('profile-image-1 프로필 이미지 크게 보기')).not.toBeInTheDocument();
    });

    const rankSelects = screen.getAllByRole('combobox', { name: '등급' });
    const firstRankSelect = rankSelects[0];
    if (!firstRankSelect) throw new Error('first rank select was not rendered');
    await user.click(firstRankSelect);
    await user.click(await screen.findByRole('option', { name: 'S' }));
    await waitFor(() => {
      expect(mockedUserReview.updateUserRank).toHaveBeenCalledWith('user-1', 'S');
    });

    expect(screen.getByRole('button', { name: '기준 미달 거절' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'profile-image-1 선택' }));
    await user.click(screen.getByRole('button', { name: '기준 미달 거절' }));
    await user.click(await screen.findByRole('button', { name: '처리' }));

    await waitFor(() => {
      expect(mockedAudit.bulkReject).toHaveBeenCalledWith({
        profileImageIds: ['profile-image-1'],
        reason: '기준에 미달하는 프로필 이미지입니다.',
      });
    });
  });
});
