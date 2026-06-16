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

    expect(screen.getByRole('button', { name: '사진 변경 요청' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '전체선택' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '전체선택' }));
    expect(screen.getByRole('checkbox', { name: 'profile-image-1 선택' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'profile-image-2 선택' })).toBeChecked();
    expect(screen.getByText('선택 2장')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '사진 변경 요청' }));
    expect(
      await screen.findByText(
        '거절 사유는 “더 원활한 매칭을 위해 사진을 변경해주세요!”로 일괄 기록됩니다.',
      ),
    ).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: '처리' }));

    await waitFor(() => {
      expect(mockedAudit.bulkReject).toHaveBeenCalledWith({
        profileImageIds: ['profile-image-1', 'profile-image-2'],
        reason: '더 원활한 매칭을 위해 사진을 변경해주세요!',
      });
    });
  });
});
