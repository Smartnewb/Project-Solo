import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import ResetPasswordPageLegacy from './reset-password-legacy';
import ResetPasswordPageV2 from './reset-password-v2';

export default async function ResetPasswordPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('reset-password');

  if (shellV2 && mode === 'v2') {
    return <ResetPasswordPageV2 />;
  }

  return <ResetPasswordPageLegacy />;
}
