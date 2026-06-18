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
    bulkFlagSecondReview: jest.fn(),
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
      meta: { page: 1, limit: 18, total: 2, totalPages: 1 },
    });
    mockedAudit.bulkMarkOk.mockResolvedValue(profileImageAuditBulkActionFixture);
    mockedAudit.bulkFlagSecondReview.mockResolvedValue(profileImageAuditBulkActionFixture);
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

  it('renders the Todo 5 read grid and detail drawer at image grain', async () => {
    const user = userEvent.setup();
    const auditItems = Array.from({ length: 18 }, (_, index) => ({
      ...profileImageAuditItemFixture,
      profileImageId: `profile-image-${index + 1}`,
      imageId: `image-${index + 1}`,
      imageUrl: `https://cdn.example.com/profile-image-${index + 1}.jpg`,
      thumbnailUrl: `https://cdn.example.com/profile-image-${index + 1}-thumb.jpg`,
      userId: index === 0 ? 'user-1' : `user-${index + 1}`,
      profileId: index === 0 ? 'profile-1' : `profile-${index + 1}`,
      age: index === 0 ? 24 : 30 + index,
      gender: index % 2 === 0 ? 'FEMALE' : 'MALE',
      universityName: index === 0 ? '서울대학교' : '연세대학교',
      slotIndex: index % 4,
      isMain: index === 0,
    }));
    mockedAudit.list.mockResolvedValueOnce({
      ...profileImageAuditListFixture,
      data: auditItems,
      meta: { page: 1, limit: 18, total: 18, totalPages: 1 },
    });

    render(<ProfileImageAuditPage />);

    expect(await screen.findByRole('heading', { level: 1, name: '프로필 이미지 전수검사' })).toBeInTheDocument();
    expect(await screen.findAllByTestId('profile-image-audit-card')).toHaveLength(18);
    expect(screen.getByText('서울대학교')).toBeInTheDocument();
    expect(screen.getByText('24세 · 여성')).toBeInTheDocument();
    expect(screen.getByText('대표 사진')).toBeInTheDocument();
    expect(screen.getAllByText('관리자 승인').length).toBeGreaterThan(0);
    expect(screen.getAllByText('자동 승인 · 88점').length).toBeGreaterThan(0);
    expect(screen.getAllByText('미검수').length).toBeGreaterThan(0);

    const detailButton = screen.getAllByRole('button', { name: '심사 상세 보기' })[0];
    if (!detailButton) throw new Error('detail button was not rendered');
    await user.click(detailButton);

    expect(await screen.findByRole('heading', { name: '심사 상세' })).toBeInTheDocument();
    expect(screen.getByText('연관 사진')).toBeInTheDocument();
    expect(screen.getByAltText('연관 사진 2')).toBeInTheDocument();
    expect(screen.getByText('신고 1회')).toBeInTheDocument();
    expect(screen.getByText('학교 인증')).toBeInTheDocument();
    expect(screen.getByText('구매 이력')).toBeInTheDocument();
    expect(screen.getByText('가입일')).toBeInTheDocument();
    expect(screen.getByText('좋아요')).toBeInTheDocument();
    expect(screen.getByText('매칭')).toBeInTheDocument();
    expect(screen.getByText('채팅')).toBeInTheDocument();
    expect(screen.getByText('이전 거절 이력')).toBeInTheDocument();
    expect(screen.getByText('거절된 이미지 이력')).toBeInTheDocument();
    expect(screen.getByText('소개글')).toBeInTheDocument();
    expect(screen.getByText('검증 점수')).toBeInTheDocument();
    expect(screen.getByText('자동 판정')).toBeInTheDocument();
    expect(screen.getByText('판정 사유')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '사용자 상세에서 열기' })).toHaveAttribute(
      'href',
      '/admin/users/appearance?userId=user-1',
    );
  });

  it('renders image-centered audit cards and bulk actions', async () => {
    const user = userEvent.setup();

    render(<ProfileImageAuditPage />);

    expect(await screen.findByRole('heading', { level: 1, name: '프로필 이미지 전수검사' })).toBeInTheDocument();
    expect(mockedAudit.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 18, auditStatus: 'unreviewed' }),
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
    expect(await screen.findByLabelText('직접 작성')).toHaveValue(
      '더 원활한 매칭을 위해 사진을 변경해주세요!',
    );
    await user.click(screen.getByRole('combobox', { name: '사진 변경 요청 사유' }));
    await user.click(await screen.findByRole('option', { name: '화질 문제로 사진 변경이 필요합니다.' }));
    await user.click(await screen.findByRole('button', { name: '처리' }));

    await waitFor(() => {
      expect(mockedAudit.bulkReject).toHaveBeenCalledWith({
        profileImageIds: ['profile-image-1', 'profile-image-2'],
        reason: '화질 문제로 사진 변경이 필요합니다.',
      });
    });
  });

  it('surfaces per-image reject failures instead of reporting success', async () => {
    const user = userEvent.setup();
    mockedAudit.bulkReject.mockResolvedValueOnce({
      data: {
        requested: 1,
        succeeded: 0,
        failed: 1,
        results: [
          {
            profileImageId: 'profile-image-1',
            userId: 'user-1',
            status: 'conflict',
            message: 'main image removal requires replacementMainProfileImageId',
          },
        ],
      },
    });

    render(<ProfileImageAuditPage />);

    await user.click(await screen.findByRole('checkbox', { name: 'profile-image-1 선택' }));
    await user.click(screen.getByRole('button', { name: '사진 변경 요청' }));
    await user.click(await screen.findByRole('button', { name: '처리' }));

    expect(
      await screen.findByText('처리 실패 1장: 대표 사진은 대체 대표 사진 지정이 필요합니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('선택한 1장을 처리했습니다.')).not.toBeInTheDocument();
  });

  it('surfaces bulk reject failures when the API omits per-image results', async () => {
    const user = userEvent.setup();
    mockedAudit.bulkReject.mockResolvedValueOnce({
      data: {
        requested: 1,
        succeeded: 0,
        failed: 1,
      },
    });

    render(<ProfileImageAuditPage />);

    await user.click(await screen.findByRole('checkbox', { name: 'profile-image-1 선택' }));
    await user.click(screen.getByRole('button', { name: '사진 변경 요청' }));
    await user.click(await screen.findByRole('button', { name: '처리' }));

    expect(await screen.findByText('처리 실패 1장: 처리하지 못했습니다.')).toBeInTheDocument();
    expect(screen.queryByText('Cannot read properties of undefined')).not.toBeInTheDocument();
  });

  it('handles bulk reject success when the API omits the succeeded count', async () => {
    const user = userEvent.setup();
    mockedAudit.bulkReject.mockResolvedValueOnce(
      JSON.parse('{"data":{"requested":1,"failed":0}}'),
    );

    render(<ProfileImageAuditPage />);

    await user.click(await screen.findByRole('checkbox', { name: 'profile-image-1 선택' }));
    await user.click(screen.getByRole('button', { name: '사진 변경 요청' }));
    await user.click(await screen.findByRole('button', { name: '처리' }));

    expect(await screen.findByText('선택한 1장을 처리했습니다.')).toBeInTheDocument();
    expect(screen.queryByText('Cannot read properties of undefined')).not.toBeInTheDocument();
  });
});
