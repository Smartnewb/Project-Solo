import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import DashboardLegacy from './dashboard-legacy';
import DashboardV2 from './dashboard-v2';

export default async function DashboardPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('dashboard');

  if (shellV2 && mode === 'v2') {
    return <DashboardV2 />;
  }

  return <DashboardLegacy />;
}
