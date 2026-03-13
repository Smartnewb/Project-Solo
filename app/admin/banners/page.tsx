import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import BannersPageLegacy from './banners-legacy';
import BannersPageV2 from './banners-v2';

export default async function BannersPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('banners');

  if (shellV2 && mode === 'v2') {
    return <BannersPageV2 />;
  }

  return <BannersPageLegacy />;
}
