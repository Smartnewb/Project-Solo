import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import MomentManagementLegacy from './moment-legacy';
import MomentManagementV2 from './moment-v2';

export default async function MomentManagementPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('moment');

  if (shellV2 && mode === 'v2') {
    return <MomentManagementV2 />;
  }

  return <MomentManagementLegacy />;
}
