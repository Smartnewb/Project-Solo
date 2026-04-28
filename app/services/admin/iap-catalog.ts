import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';
import type { AppleIapPricePoint, SyncApplePricesResponse } from '@/types/admin';

export const iapCatalog = {
  /**
   * Trigger an Apple Connect API sync for KOR storefront.
   * POST /v1/admin/iap/sync-apple-prices
   */
  syncApplePrices: async (): Promise<SyncApplePricesResponse> => {
    return adminPost<SyncApplePricesResponse>('/v1/admin/iap/sync-apple-prices');
  },

  /**
   * Get cached Apple IAP price points for a given storefront.
   * GET /v1/admin/iap/price-points?storefront=KOR
   */
  getPricePoints: async (storefront = 'KOR'): Promise<AppleIapPricePoint[]> => {
    return adminGet<AppleIapPricePoint[]>('/v1/admin/iap/price-points', {
      storefront,
    });
  },
};
