import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import UsersLegacy from './users-legacy';
import UsersV2 from './users-v2';

export default async function UsersPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('users');

  if (shellV2 && mode === 'v2') {
    return <UsersV2 />;
  }

  return <UsersLegacy />;
}
