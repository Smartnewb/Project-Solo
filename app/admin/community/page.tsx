import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import CommunityLegacy from './community-legacy';
import CommunityV2 from './community-v2';

export default async function CommunityPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('community');

  if (shellV2 && mode === 'v2') {
    return <CommunityV2 />;
  }

  return <CommunityLegacy />;
}
