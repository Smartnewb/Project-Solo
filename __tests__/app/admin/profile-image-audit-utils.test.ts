import type { ProfileImageAuditSiblingImage } from '@/app/services/admin';
import {
  filterVisibleAuditItems,
  sortAuditSiblingImages,
} from '@/app/admin/profile-image-audit/profile-image-audit-utils';
import { profileImageAuditItemFixture } from '@/__tests__/app/services/fixtures/profile-image-audit';

describe('profile image audit display utilities', () => {
  it('orders sibling images with the current representative image first, then slots', () => {
    const images: readonly ProfileImageAuditSiblingImage[] = [
      {
        profileImageId: 'slot-0',
        imageId: 'image-0',
        imageUrl: 'https://cdn.example.com/slot-0.jpg',
        thumbnailUrl: null,
        slotIndex: 0,
        isMain: false,
        reviewStatus: 'approved',
      },
      {
        profileImageId: 'slot-2',
        imageId: 'image-2',
        imageUrl: 'https://cdn.example.com/slot-2.jpg',
        thumbnailUrl: null,
        slotIndex: 2,
        isMain: false,
        reviewStatus: 'approved',
      },
      {
        profileImageId: 'slot-1-main',
        imageId: 'image-1',
        imageUrl: 'https://cdn.example.com/slot-1.jpg',
        thumbnailUrl: null,
        slotIndex: 1,
        isMain: true,
        reviewStatus: 'approved',
      },
    ];

    expect(sortAuditSiblingImages(images).map((image) => image.profileImageId)).toEqual([
      'slot-1-main',
      'slot-0',
      'slot-2',
    ]);
  });

  it('hides blacklisted and suspended users unless the operator explicitly includes them', () => {
    const visibleItem = profileImageAuditItemFixture;
    const blacklistedItem = {
      ...profileImageAuditItemFixture,
      profileImageId: 'blacklisted-image',
      isBlacklisted: true,
    };
    const suspendedItem = {
      ...profileImageAuditItemFixture,
      profileImageId: 'suspended-image',
      suspendedAt: '2026-06-17T05:18:28.953Z',
    };

    expect(
      filterVisibleAuditItems([visibleItem, blacklistedItem, suspendedItem], {
        auditStatus: 'unreviewed',
        includeBlacklisted: false,
        includeSuspended: false,
      }).map((item) => item.profileImageId),
    ).toEqual(['profile-image-1']);

    expect(
      filterVisibleAuditItems([visibleItem, blacklistedItem, suspendedItem], {
        auditStatus: 'unreviewed',
        includeBlacklisted: true,
        includeSuspended: true,
      }).map((item) => item.profileImageId),
    ).toEqual(['profile-image-1', 'blacklisted-image', 'suspended-image']);
  });
});
