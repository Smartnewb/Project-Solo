import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import DeletedFemalesPageLegacy from './deleted-females-legacy';
import DeletedFemalesPageV2 from './deleted-females-v2';

export default async function DeletedFemalesPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('deleted-females');

  if (shellV2 && mode === 'v2') {
    return <DeletedFemalesPageV2 />;
  }

  return <DeletedFemalesPageLegacy />;
}
