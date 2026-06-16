import type { ProfileImageAuditSiblingImage } from '@/app/services/admin';
import { sortAuditSiblingImages } from '@/app/admin/profile-image-audit/profile-image-audit-utils';

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
});
