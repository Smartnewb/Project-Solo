import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import FcmTokensPageLegacy from './fcm-tokens-legacy';
import FcmTokensPageV2 from './fcm-tokens-v2';

export default async function FcmTokensPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('fcm-tokens');

  if (shellV2 && mode === 'v2') {
    return <FcmTokensPageV2 />;
  }

  return <FcmTokensPageLegacy />;
}
