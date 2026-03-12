import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import PushNotificationsLegacy from './push-notifications-legacy';
import PushNotificationsV2 from './push-notifications-v2';

export default async function PushNotificationsPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('push-notifications');

  if (shellV2 && mode === 'v2') {
    return <PushNotificationsV2 />;
  }

  return <PushNotificationsLegacy />;
}
