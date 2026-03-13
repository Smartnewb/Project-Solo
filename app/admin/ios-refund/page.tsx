import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import IOSRefundPageLegacy from './ios-refund-legacy';
import IOSRefundPageV2 from './ios-refund-v2';

export default async function IOSRefundPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('ios-refund');

  if (shellV2 && mode === 'v2') {
    return <IOSRefundPageV2 />;
  }

  return <IOSRefundPageLegacy />;
}
