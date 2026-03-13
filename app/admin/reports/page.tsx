import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import ReportsLegacy from './reports-legacy';
import ReportsV2 from './reports-v2';

export default async function ReportsPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('reports');

  if (shellV2 && mode === 'v2') {
    return <ReportsV2 />;
  }

  return <ReportsLegacy />;
}
