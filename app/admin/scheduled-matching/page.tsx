import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import ScheduledMatchingLegacy from './scheduled-matching-legacy';
import ScheduledMatchingV2 from './scheduled-matching-v2';

export default async function ScheduledMatchingPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('scheduled-matching');

  if (shellV2 && mode === 'v2') {
    return <ScheduledMatchingV2 />;
  }

  return <ScheduledMatchingLegacy />;
}
