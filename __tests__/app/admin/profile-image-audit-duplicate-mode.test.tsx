import { selectHeroValue } from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileImageAuditPage from '@/app/admin/profile-image-audit/profile-image-audit-v2';
import { DUPLICATE_REJECT_REASON } from '@/app/admin/profile-image-audit/constants';
import { profileImageAudit } from '@/app/services/admin';
import type { ProfileImageAuditItem } from '@/app/services/admin';
import { profileImageAuditItemFixture } from '@/__tests__/app/services/fixtures/profile-image-audit';

jest.mock('@/app/services/admin', () => ({
  profileImageAudit: {
    list: jest.fn(),
    bulkMarkOk: jest.fn(),
    bulkFlagSecondReview: jest.fn(),
    bulkReject: jest.fn(),
    bulkDelete: jest.fn(),
    buildBlacklistHandoff: jest.fn(),
  },
  userReview: { updateUserRank: jest.fn() },
}));

const mockedAudit = profileImageAudit as jest.Mocked<typeof profileImageAudit>;

const threePhotoSiblings = ['a', 'b', 'c'].map((suffix, index) => ({
  profileImageId: `pi-${suffix}`,
  imageId: `img-${suffix}`,
  imageUrl: `https://cdn.example.com/${suffix}.jpg`,
  thumbnailUrl: null,
  slotIndex: index,
  isMain: index === 0,
  reviewStatus: 'approved' as const,
}));

const userOneItems: ProfileImageAuditItem[] = threePhotoSiblings.map((sibling) => ({
  ...profileImageAuditItemFixture,
  profileImageId: sibling.profileImageId,
  imageId: sibling.imageId,
  imageUrl: sibling.imageUrl,
  slotIndex: sibling.slotIndex,
  isMain: sibling.isMain,
  siblingImages: threePhotoSiblings,
}));

const userTwoItem: ProfileImageAuditItem = {
  ...profileImageAuditItemFixture,
  profileImageId: 'pi-z',
  userId: 'user-2',
  profileId: 'profile-2',
  userName: '박테스트',
  siblingImages: [{ ...threePhotoSiblings[0], profileImageId: 'pi-z', imageId: 'img-z' }],
};

describe('ProfileImageAudit duplicate review mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAudit.list.mockResolvedValue({
      data: [...userOneItems, userTwoItem],
      meta: { page: 1, limit: 100, total: 4, totalPages: 1 },
    });
    mockedAudit.bulkMarkOk.mockImplementation(async ({ profileImageIds }) => ({
      data: {
        requested: profileImageIds.length,
        succeeded: profileImageIds.length,
        failed: 0,
        results: profileImageIds.map((profileImageId) => ({ profileImageId, status: 'success' as const })),
      },
    }));
    mockedAudit.bulkReject.mockImplementation(async ({ profileImageIds }) => ({
      data: {
        requested: profileImageIds.length,
        succeeded: profileImageIds.length,
        failed: 0,
        results: profileImageIds.map((profileImageId) => ({ profileImageId, status: 'success' as const })),
      },
    }));
  });

  it('groups photos into one row per user and keeps the active filters', async () => {
    render(<ProfileImageAuditPage />);
    await screen.findAllByTestId('profile-image-audit-card');

    fireEvent.click(screen.getByRole('button', { name: /중복검사/ }));

    const rows = await screen.findAllByTestId('duplicate-review-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getAllByTestId('duplicate-review-photo')).toHaveLength(3);
    expect(within(rows[1]).getAllByTestId('duplicate-review-photo')).toHaveLength(1);
    expect(mockedAudit.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ auditStatus: 'unreviewed', population: 'regular_photo', page: 1, limit: 100 }),
    );
  });

  it('sends a change request per photo with its own reason, defaulting to the duplicate reason', async () => {
    render(<ProfileImageAuditPage />);
    await screen.findAllByTestId('profile-image-audit-card');
    fireEvent.click(screen.getByRole('button', { name: /중복검사/ }));
    await screen.findAllByTestId('duplicate-review-row');

    fireEvent.click(screen.getByRole('checkbox', { name: 'pi-b 선택' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'pi-c 선택' }));
    await selectHeroValue('pi-c 변경 사유', '화질 불량');

    fireEvent.click(screen.getByRole('button', { name: /선택한 사진 변경 요청/ }));

    await waitFor(() => expect(mockedAudit.bulkReject).toHaveBeenCalledTimes(2));
    expect(mockedAudit.bulkReject).toHaveBeenCalledWith({ profileImageIds: ['pi-b'], reason: DUPLICATE_REJECT_REASON });
    expect(mockedAudit.bulkReject).toHaveBeenCalledWith({ profileImageIds: ['pi-c'], reason: '화질 불량' });
    expect(await screen.findByText('2장에 사진 변경을 요청했습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'pi-b 선택' })).not.toBeInTheDocument();
  });

  it('marks only rows up to the pressed one as ok, skipping change-requested photos', async () => {
    render(<ProfileImageAuditPage />);
    await screen.findAllByTestId('profile-image-audit-card');
    fireEvent.click(screen.getByRole('button', { name: /중복검사/ }));
    await screen.findAllByTestId('duplicate-review-row');

    fireEvent.click(screen.getByRole('checkbox', { name: 'pi-b 선택' }));
    fireEvent.click(screen.getByRole('button', { name: /선택한 사진 변경 요청/ }));
    await screen.findByText('1장에 사진 변경을 요청했습니다.');

    fireEvent.click(screen.getByRole('button', { name: '김테스트까지 확인 완료' }));
    expect(await screen.findByText('선택한 프로필 이미지 2장을 처리합니다.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '처리' }));

    await waitFor(() => expect(mockedAudit.bulkMarkOk).toHaveBeenCalledTimes(1));
    expect(mockedAudit.bulkMarkOk).toHaveBeenCalledWith({ profileImageIds: ['pi-a', 'pi-c'] });
    expect(await screen.findByText('1명 확인 완료 · 사진 2장 정상 처리')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '김테스트까지 확인 완료' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '박테스트까지 확인 완료' })).toBeInTheDocument();
  });

  it('blocks completion while a selected photo has not been sent', async () => {
    render(<ProfileImageAuditPage />);
    await screen.findAllByTestId('profile-image-audit-card');
    fireEvent.click(screen.getByRole('button', { name: /중복검사/ }));
    await screen.findAllByTestId('duplicate-review-row');

    fireEvent.click(screen.getByRole('checkbox', { name: 'pi-b 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '박테스트까지 확인 완료' }));

    expect(await screen.findByText('선택한 사진의 변경 요청을 먼저 보내거나 선택을 해제해주세요.')).toBeInTheDocument();
    expect(mockedAudit.bulkMarkOk).not.toHaveBeenCalled();
  });
});
