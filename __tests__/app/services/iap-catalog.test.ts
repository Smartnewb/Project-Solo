jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
  adminPatch: jest.fn(),
  adminUpload: jest.fn(),
}));

import { iapCatalog } from '@/app/services/admin/iap-catalog';
import {
  adminGet,
  adminPatch,
  adminPost,
  adminUpload,
} from '@/shared/lib/http/admin-fetch';

describe('iapCatalog admin service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads the versioned KR/JP commerce catalog', async () => {
    (adminGet as jest.Mock).mockResolvedValue({ data: { KR: [], JP: [] } });

    await expect(iapCatalog.getCommerceProducts()).resolves.toEqual({ KR: [], JP: [] });
    expect(adminGet).toHaveBeenCalledWith('/v1/admin/catalog/products');
  });

  it('adds immutable confirmations to Google Play registration', async () => {
    (adminPost as jest.Mock).mockResolvedValue({ data: { operationId: 'operation-1' } });

    await iapCatalog.registerGooglePlayProduct('version-1', {
      productId: 'gem_std_150',
      purchaseOptionId: 'standard-buy',
      localizations: [
        { languageCode: 'ko-KR', title: '구슬 150개', description: '구슬 150개' },
        { languageCode: 'ja-JP', title: 'ビー玉150個', description: 'ビー玉150個' },
      ],
      priceKRW: 15000,
      priceJPY: 1500,
      legacyCompatible: true,
    });

    expect(adminPost).toHaveBeenCalledWith(
      '/v1/admin/iap/catalog/versions/version-1/google/register',
      expect.objectContaining({
        targetCountries: ['KR', 'JP'],
        confirmImmutableFields: true,
      }),
    );
  });

  it('publishes KR and JP in one confirmed request', async () => {
    (adminPost as jest.Mock).mockResolvedValue({
      data: { KR: { catalogId: 'kr-1', version: 1 }, JP: { catalogId: 'jp-1', version: 1 } },
    });

    await iapCatalog.publishCommerceCatalog({
      krProductVersionIds: ['kr-version'],
      jpProductVersionIds: ['jp-version'],
    });

    expect(adminPost).toHaveBeenCalledWith('/v1/admin/catalog/publish', {
      surface: 'gem_store',
      krProductVersionIds: ['kr-version'],
      jpProductVersionIds: ['jp-version'],
      confirmPublish: true,
    });
  });

  it('uses PATCH for draft edits and multipart upload for Apple review', async () => {
    (adminPatch as jest.Mock).mockResolvedValue({ data: { productVersionId: 'version-1' } });
    (adminUpload as jest.Mock).mockResolvedValue({ data: { operationId: 'operation-1' } });

    await iapCatalog.updateCommerceDraft('version-1', { sortOrder: 3 });
    const file = new File(['image'], 'review.png', { type: 'image/png' });
    await iapCatalog.uploadAppleReviewScreenshot('version-1', file);

    expect(adminPatch).toHaveBeenCalledWith('/v1/admin/catalog/versions/version-1', {
      sortOrder: 3,
    });
    expect(adminUpload).toHaveBeenCalledWith(
      '/v1/admin/iap/catalog/versions/version-1/review-screenshot',
      expect.any(FormData),
    );
  });
});
