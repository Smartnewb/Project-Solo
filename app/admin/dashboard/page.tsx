import { getRouteMode } from '@/shared/feature-flags';
import DashboardLegacy from './dashboard-legacy';
import DashboardV2 from './dashboard-v2';

export default async function DashboardPage() {
  const mode = await getRouteMode('dashboard');

  if (mode === 'v2') {
    return <DashboardV2 />;
  }

  return <DashboardLegacy />;
}
