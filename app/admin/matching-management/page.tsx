import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import MatchingManagementLegacy from './matching-management-legacy';
import MatchingManagementV2 from './matching-management-v2';

export default async function MatchingManagementPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('matching-management');

  if (shellV2 && mode === 'v2') {
    return <MatchingManagementV2 />;
  }

  return <MatchingManagementLegacy />;
}
