import {
  adminGet,
  adminPatch,
  adminPost,
  adminUpload,
} from '@/shared/lib/http/admin-fetch';
import type {
  AdminAppleIapProduct,
  AdminGemProduct,
  AppleIapPricePoint,
  CommerceCatalogOperationResult,
  CommerceCatalogProductsResponse,
  CreateCommerceProductRequest,
  GooglePlayOneTimeProduct,
  SyncApplePricesResponse,
} from '@/types/admin';

type AdminDataResponse<T> = T | { data: T };

function unwrapAdminData<T>(response: AdminDataResponse<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  return response;
}

function unwrapAdminList<T>(response: AdminDataResponse<T[]> | undefined): T[] {
  const data = response === undefined ? undefined : unwrapAdminData(response);
  return Array.isArray(data) ? data : [];
}

export const iapCatalog = {
  getCommerceProducts: async (): Promise<CommerceCatalogProductsResponse> => {
    const res = await adminGet<AdminDataResponse<CommerceCatalogProductsResponse>>(
      '/v1/admin/catalog/products',
    );
    return unwrapAdminData(res);
  },

  createCommerceProduct: async (body: CreateCommerceProductRequest) => {
    const res = await adminPost<
      AdminDataResponse<{
        productId: string;
        productVersionId: string;
        version: number;
        status: 'DRAFT';
      }>
    >('/v1/admin/catalog/products', body);
    return unwrapAdminData(res);
  },

  updateCommerceDraft: async (
    versionId: string,
    body: Partial<Pick<CreateCommerceProductRequest, 'localizations' | 'entitlements' | 'sortOrder' | 'uiMetadata'>>,
  ) => {
    const res = await adminPatch<AdminDataResponse<{ productVersionId: string; status: 'DRAFT' }>>(
      `/v1/admin/catalog/versions/${encodeURIComponent(versionId)}`,
      body,
    );
    return unwrapAdminData(res);
  },

  setCommerceProductActive: async (productId: string, isActive: boolean) => {
    const res = await adminPatch<AdminDataResponse<{ productId: string; isActive: boolean }>>(
      `/v1/admin/catalog/products/${encodeURIComponent(productId)}/active`,
      { isActive },
    );
    return unwrapAdminData(res);
  },

  cloneCommerceVersion: async (krProductId: string, jpProductId: string) => {
    const res = await adminPost<
      AdminDataResponse<{ productVersionId: string; version: number; status: 'DRAFT' }>
    >('/v1/admin/catalog/versions/clone', { krProductId, jpProductId });
    return unwrapAdminData(res);
  },

  publishCommerceCatalog: async (body: {
    krProductVersionIds: string[];
    jpProductVersionIds: string[];
  }) => {
    const res = await adminPost<AdminDataResponse<Record<'KR' | 'JP', { catalogId: string; version: number }>>>(
      '/v1/admin/catalog/publish',
      { surface: 'gem_store', ...body, confirmPublish: true },
    );
    return unwrapAdminData(res);
  },

  registerAppleProduct: async (
    versionId: string,
    body: {
      productId: string;
      referenceName: string;
      appleProductType: 'CONSUMABLE' | 'NON_CONSUMABLE' | 'NON_RENEWING_SUBSCRIPTION';
      reviewNote: string;
      localizations: Array<{ locale: 'ko' | 'ja' | 'en-US'; name: string; description: string }>;
      priceKRW: number;
      priceJPY: number;
    },
  ): Promise<CommerceCatalogOperationResult> => {
    const res = await adminPost<AdminDataResponse<CommerceCatalogOperationResult>>(
      `/v1/admin/iap/catalog/versions/${encodeURIComponent(versionId)}/register`,
      { ...body, targetCountries: ['KR', 'JP'], confirmImmutableFields: true },
    );
    return unwrapAdminData(res);
  },

  uploadAppleReviewScreenshot: async (versionId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await adminUpload<AdminDataResponse<CommerceCatalogOperationResult>>(
      `/v1/admin/iap/catalog/versions/${encodeURIComponent(versionId)}/review-screenshot`,
      formData,
    );
    return unwrapAdminData(res);
  },

  submitAppleReview: async (versionId: string) => {
    const res = await adminPost<AdminDataResponse<CommerceCatalogOperationResult>>(
      `/v1/admin/iap/catalog/versions/${encodeURIComponent(versionId)}/submit-review`,
      { confirmSubmit: true },
    );
    return unwrapAdminData(res);
  },

  syncAppleCatalogStatus: async (versionId: string) => {
    const res = await adminPost<AdminDataResponse<CommerceCatalogOperationResult>>(
      `/v1/admin/iap/catalog/versions/${encodeURIComponent(versionId)}/sync-status`,
    );
    return unwrapAdminData(res);
  },

  getGooglePlayProducts: async (): Promise<GooglePlayOneTimeProduct[]> => {
    const res = await adminGet<AdminDataResponse<GooglePlayOneTimeProduct[]>>(
      '/v1/admin/iap/catalog/google/products',
    );
    return unwrapAdminList(res);
  },

  registerGooglePlayProduct: async (
    versionId: string,
    body: {
      productId: string;
      purchaseOptionId: string;
      localizations: Array<{ languageCode: 'ko-KR' | 'ja-JP' | 'en-US'; title: string; description: string }>;
      priceKRW: number;
      priceJPY: number;
      legacyCompatible: boolean;
    },
  ): Promise<CommerceCatalogOperationResult> => {
    const res = await adminPost<AdminDataResponse<CommerceCatalogOperationResult>>(
      `/v1/admin/iap/catalog/versions/${encodeURIComponent(versionId)}/google/register`,
      { ...body, targetCountries: ['KR', 'JP'], confirmImmutableFields: true },
    );
    return unwrapAdminData(res);
  },

  setGooglePlayState: async (versionId: string, state: 'ACTIVE' | 'INACTIVE') => {
    const res = await adminPost<AdminDataResponse<CommerceCatalogOperationResult>>(
      `/v1/admin/iap/catalog/versions/${encodeURIComponent(versionId)}/google/state`,
      { state, confirmStateChange: true },
    );
    return unwrapAdminData(res);
  },

  syncGooglePlayStatus: async (versionId: string) => {
    const res = await adminPost<AdminDataResponse<CommerceCatalogOperationResult>>(
      `/v1/admin/iap/catalog/versions/${encodeURIComponent(versionId)}/google/sync-status`,
    );
    return unwrapAdminData(res);
  },

  /**
   * Trigger an Apple Connect API sync for the current country storefront.
   * POST /v1/admin/iap/sync-apple-prices
   */
  syncApplePrices: async (): Promise<SyncApplePricesResponse> => {
    const res = await adminPost<AdminDataResponse<SyncApplePricesResponse>>(
      '/v1/admin/iap/sync-apple-prices',
    );
    return unwrapAdminData(res);
  },

  /**
   * Get synced Apple IAP products with gem product mapping status.
   * GET /v1/admin/iap/products?storefront=KOR
   */
  getProducts: async (storefront = 'KOR'): Promise<AdminAppleIapProduct[]> => {
    const res = await adminGet<AdminDataResponse<AdminAppleIapProduct[]>>('/v1/admin/iap/products', {
      storefront,
    });
    return unwrapAdminList(res);
  },

  /**
   * Map a synced Apple SKU to one gem product.
   * POST /v1/admin/iap/gem-products/:productId/apple-sku
   */
  mapAppleSkuToGemProduct: async (
    productId: string,
    appleSku: string,
  ): Promise<AdminGemProduct> => {
    const res = await adminPost<AdminDataResponse<AdminGemProduct>>(
      `/v1/admin/iap/gem-products/${productId}/apple-sku`,
      { appleSku },
    );
    return unwrapAdminData(res);
  },

  /**
   * Get cached Apple IAP price points for a given storefront.
   * GET /v1/admin/iap/price-points?storefront=KOR
   */
  getPricePoints: async (storefront = 'KOR'): Promise<AppleIapPricePoint[]> => {
    const res = await adminGet<AdminDataResponse<AppleIapPricePoint[]>>('/v1/admin/iap/price-points', {
      storefront,
    });
    return unwrapAdminList(res);
  },
};
