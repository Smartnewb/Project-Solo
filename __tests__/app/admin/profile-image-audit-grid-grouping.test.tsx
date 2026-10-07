import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileImageAuditGrid } from '@/app/admin/profile-image-audit/components/ProfileImageAuditGrid';
import type { ProfileImageAuditItem } from '@/app/services/admin';
import { profileImageAuditItemFixture } from '@/__tests__/app/services/fixtures/profile-image-audit';

function photo(profileId: string, slotIndex: number): ProfileImageAuditItem {
  return {
    ...profileImageAuditItemFixture,
    profileImageId: `${profileId}-pi-${slotIndex}`,
    imageId: `${profileId}-img-${slotIndex}`,
    profileId,
    userId: `${profileId}-user`,
    userName: profileId,
    slotIndex,
    isMain: slotIndex === 0,
  };
}

describe('ProfileImageAuditGrid user grouping', () => {
  it('wraps consecutive photos of the same profile in one bordered group, whatever the photo count', () => {
    const items = [photo('p1', 0), photo('p1', 1), photo('p1', 2), photo('p2', 0), photo('p3', 0), photo('p3', 1)];

    render(<ProfileImageAuditGrid items={items} selectedIds={new Set()} loading={false} onToggle={jest.fn()} onRankChange={jest.fn()} rankUpdatingUserId={null} />);

    const groups = screen.getAllByTestId('profile-image-audit-user-group');
    expect(groups.map((group) => within(group).getAllByTestId('profile-image-audit-card').length)).toEqual([3, 1, 2]);
    expect(groups[0]).toHaveAccessibleName('p1 사진 묶음');
  });
});
