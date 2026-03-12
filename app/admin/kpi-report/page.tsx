import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import KpiReportLegacy from './kpi-report-legacy';
import KpiReportV2 from './kpi-report-v2';

export default async function KpiReportPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('kpi-report');

  if (shellV2 && mode === 'v2') {
    return <KpiReportV2 />;
  }

  return <KpiReportLegacy />;
}
