import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';
import type {
  AdminAppleIapProduct,
  AdminGemProduct,
  AppleIapPricePoint,
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
