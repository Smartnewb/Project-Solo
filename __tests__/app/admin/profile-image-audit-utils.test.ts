import type { ProfileImageAuditSiblingImage } from '@/app/services/admin';
import {
  auditFiltersFromQuery,
  auditFiltersToQuery,
  filterVisibleAuditItems,
  sortAuditSiblingImages,
} from '@/app/admin/profile-image-audit/profile-image-audit-utils';
import { DEFAULT_FILTERS } from '@/app/admin/profile-image-audit/constants';
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

describe('profile image audit filters in the address bar', () => {
  it('keeps the default view out of the address bar', () => {
    expect(auditFiltersToQuery(DEFAULT_FILTERS, 1)).toBe('');
    const restored = auditFiltersFromQuery(new URLSearchParams(''), DEFAULT_FILTERS);
    expect(restored.page).toBe(1);
    expect(restored.filters).toMatchObject({ ...DEFAULT_FILTERS, includeAlreadyAudited: false });
  });

  it('restores status, search and page after a reload', () => {
    const query = auditFiltersToQuery(
      { ...DEFAULT_FILTERS, auditStatus: 'rejected', search: '김테스트', gender: 'FEMALE', isMain: true },
      3,
    );
    const restored = auditFiltersFromQuery(new URLSearchParams(query), DEFAULT_FILTERS);
    expect(restored.page).toBe(3);
    expect(restored.filters).toMatchObject({
      auditStatus: 'rejected', includeAlreadyAudited: false, search: '김테스트', gender: 'FEMALE', isMain: true,
    });
  });

  it('distinguishes the all view from the default unreviewed view', () => {
    const query = auditFiltersToQuery({ ...DEFAULT_FILTERS, auditStatus: undefined, includeAlreadyAudited: true }, 1);
    expect(query).toBe('status=all');
    expect(auditFiltersFromQuery(new URLSearchParams(query), DEFAULT_FILTERS).filters).toMatchObject({
      auditStatus: undefined, includeAlreadyAudited: true,
    });
  });
});
