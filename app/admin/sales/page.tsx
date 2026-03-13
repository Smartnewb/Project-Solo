import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import SalesPageLegacy from './sales-legacy';
import SalesPageV2 from './sales-v2';

export default async function SalesPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('sales');

  if (shellV2 && mode === 'v2') {
    return <SalesPageV2 />;
  }

  return <SalesPageLegacy />;
}
