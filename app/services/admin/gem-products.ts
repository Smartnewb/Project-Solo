import { adminGet } from '@/shared/lib/http/admin-fetch';
import type { AdminGemProduct } from '@/types/admin';

/**
 * Gem Products admin client.
 *
 * NOTE: There is currently no dedicated `/v1/admin/gem-products` endpoint.
 * We reuse the user-facing `/v1/gem/products` endpoint which is reachable
 * with admin role (see GemController @Roles(Role.USER, Role.ADMIN)).
 *
 * The response shape is plain `AdminGemProduct[]` (the controller returns
 * the array directly via GemProductViewer.getAvailableProducts()).
 */
export const gemProducts = {
  getList: async (): Promise<AdminGemProduct[]> => {
    return adminGet<AdminGemProduct[]>('/v1/gem/products');
  },
};
