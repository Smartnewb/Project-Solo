import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnclassifiedUsersPanel from '@/components/admin/appearance/UnclassifiedUsersPanel';

jest.mock('@/components/admin/common/RegionFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="region-filter" />,
  useRegionFilter: () => ({
    region: '',
    setRegion: jest.fn(),
    getRegionParam: () => undefined,
  }),
}));

jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: {
    userAppearance: {
      getUnclassifiedUsers: jest.fn(),
      getUserDetails: jest.fn(),
      setUserAppearanceGrade: jest.fn(),
    },
  },
}));

import AdminService from '@/app/services/admin';

const mockGetUnclassifiedUsers = AdminService.userAppearance.getUnclassifiedUsers as jest.Mock;

function makeUser(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    userId: id,
    name: id,
    gender: 'FEMALE',
    age: 22,
    appearanceGrade: 'UNKNOWN',
    createdAt: '2026-05-06T00:00:00.000Z',
    profileImages: [],
    ...overrides,
  };
}

describe('UnclassifiedUsersPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters cohorts before local pagination so later-page blind-approved users are visible', async () => {
    const firstPageUsers = Array.from({ length: 100 }, (_, index) =>
      makeUser(`grade-${index + 1}`, {
        approvedPhotoCount: 1,
        hasApprovedPhoto: true,
        approvalMode: 'GRADE_REQUIRED',
      }),
    );
    const fullUsers = [
      ...firstPageUsers,
      makeUser('blind-1', {
        approvedPhotoCount: 0,
        hasApprovedPhoto: false,
        approvalMode: 'BLIND_APPROVED',
        blindMatchingApprovedAt: '2026-05-06T00:00:00.000Z',
      }),
      makeUser('blind-2', {
        approvedPhotoCount: 0,
        hasApprovedPhoto: false,
        approvalMode: 'BLIND_APPROVED',
        blindMatchingApprovedAt: '2026-05-06T00:00:00.000Z',
      }),
    ];

    mockGetUnclassifiedUsers
      .mockResolvedValueOnce({ data: firstPageUsers, meta: { totalItems: 102, totalPages: 2 } })
      .mockResolvedValueOnce({ data: fullUsers.slice(100), meta: { totalItems: 102, totalPages: 2 } });

    render(<UnclassifiedUsersPanel />);

    expect(await screen.findByRole('tab', { name: '블라인드 승인 (2)' })).toBeInTheDocument();
    expect(mockGetUnclassifiedUsers).toHaveBeenNthCalledWith(1, 1, 100, undefined);
    expect(mockGetUnclassifiedUsers).toHaveBeenNthCalledWith(2, 2, 100, undefined);

    fireEvent.click(screen.getByRole('tab', { name: '블라인드 승인 (2)' }));

    await waitFor(() => {
      expect(screen.getByText('blind-1')).toBeInTheDocument();
      expect(screen.getByText('blind-2')).toBeInTheDocument();
    });
    expect(screen.queryByText('블라인드 승인 사용자가 없습니다.')).not.toBeInTheDocument();
  });
});
