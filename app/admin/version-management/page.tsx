import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import VersionManagementLegacy from './version-management-legacy';
import VersionManagementV2 from './version-management-v2';

export default async function VersionManagementPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('version-management');

  if (shellV2 && mode === 'v2') {
    return <VersionManagementV2 />;
  }

  return <VersionManagementLegacy />;
}
