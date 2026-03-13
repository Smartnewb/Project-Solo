import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import GemsLegacy from './gems-legacy';
import GemsV2 from './gems-v2';

export default async function GemsPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('gems');

  if (shellV2 && mode === 'v2') {
    return <GemsV2 />;
  }

  return <GemsLegacy />;
}
