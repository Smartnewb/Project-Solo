import { getRouteMode } from '@/shared/feature-flags';
import KpiReportLegacy from './kpi-report-legacy';
import KpiReportV2 from './kpi-report-v2';

export default async function KpiReportPage() {
  const mode = await getRouteMode('kpi-report');

  if (mode === 'v2') {
    return <KpiReportV2 />;
  }

  return <KpiReportLegacy />;
}
