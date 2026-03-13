import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import DormantLikesPageLegacy from './dormant-likes-legacy';
import DormantLikesPageV2 from './dormant-likes-v2';

export default async function DormantLikesPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('dormant-likes');

  if (shellV2 && mode === 'v2') {
    return <DormantLikesPageV2 />;
  }

  return <DormantLikesPageLegacy />;
}
