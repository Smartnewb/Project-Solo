import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import SmspageLegacy from './sms-legacy';
import SmspageV2 from './sms-v2';

export default async function SmspagePage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('sms');

  if (shellV2 && mode === 'v2') {
    return <SmspageV2 />;
  }

  return <SmspageLegacy />;
}
