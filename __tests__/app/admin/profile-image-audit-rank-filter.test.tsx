import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileImageAuditPage from '@/app/admin/profile-image-audit/profile-image-audit-v2';
import { profileImageAudit } from '@/app/services/admin';
import { profileImageAuditItemFixture } from '@/__tests__/app/services/fixtures/profile-image-audit';

jest.mock('@/app/services/admin', () => ({
  profileImageAudit: { list: jest.fn() },
}));

const listMock = jest.mocked(profileImageAudit.list);

describe('profile image audit rank filter', () => {
  beforeEach(() => {
    listMock.mockReset();
    listMock.mockResolvedValue({
      data: [profileImageAuditItemFixture],
      meta: { page: 1, limit: 18, total: 36, totalPages: 2 },
    });
  });

  it.each(['S', 'A', 'B', 'C'] as const)(
    'requests rank %s from page one while preserving other filters',
    async (rank) => {
      // Given: another page and a gender filter are active.
      const user = userEvent.setup();
      render(<ProfileImageAuditPage />);
      await screen.findByTestId('profile-image-audit-card');
      await selectHeroValue('성별','FEMALE');
      await user.click(screen.getByRole('button', { name: '다음' }));
      expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
      const requested = new Promise<void>((resolve) => {
        listMock.mockImplementationOnce(async (params) => {
          expect(params).toMatchObject({
            page: 1, limit: 18, gender: 'FEMALE', auditStatus: 'unreviewed', profileRank: rank,
          });
          resolve();
          return { data: [], meta: { page: 1, limit: 18, total: 0, totalPages: 0 } };
        });
      });

      // When: an appearance rank is selected.
      await selectHeroValue('외모 등급',rank);

      // Then: the request contains the rank and resets pagination.
      await requested;
    },
  );

  it('removes the rank constraint when all ranks are selected', async () => {
    // Given: the S rank filter is selected.
    const user = userEvent.setup();
    render(<ProfileImageAuditPage />);
    await screen.findByTestId('profile-image-audit-card');
    await selectHeroValue('외모 등급','S');

    // When: all ranks are selected again.
    await selectHeroValue('외모 등급','');

    // Then: the rank no longer constrains the request.
    expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 1, profileRank: undefined, auditStatus: 'unreviewed',
    }));
  });
});
