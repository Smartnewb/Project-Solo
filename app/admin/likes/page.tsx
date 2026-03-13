import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import LikesManagementPageLegacy from './likes-legacy';
import LikesManagementPageV2 from './likes-v2';

export default async function LikesManagementPagePage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('likes');

  if (shellV2 && mode === 'v2') {
    return <LikesManagementPageV2 />;
  }

  return <LikesManagementPageLegacy />;
}
