import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import ForceMatchingLegacy from './force-matching-legacy';
import ForceMatchingV2 from './force-matching-v2';

export default async function ForceMatchingPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('force-matching');

  if (shellV2 && mode === 'v2') {
    return <ForceMatchingV2 />;
  }

  return <ForceMatchingLegacy />;
}
