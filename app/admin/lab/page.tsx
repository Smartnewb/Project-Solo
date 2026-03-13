import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import LabLegacy from './lab-legacy';
import LabV2 from './lab-v2';

export default async function LabPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('lab');

  if (shellV2 && mode === 'v2') {
    return <LabV2 />;
  }

  return <LabLegacy />;
}
