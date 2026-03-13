import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import UniversitiesPageLegacy from './universities-legacy';
import UniversitiesPageV2 from './universities-v2';

export default async function UniversitiesPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('universities');

  if (shellV2 && mode === 'v2') {
    return <UniversitiesPageV2 />;
  }

  return <UniversitiesPageLegacy />;
}
