import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import FemaleRetentionPageLegacy from './female-retention-legacy';
import FemaleRetentionPageV2 from './female-retention-v2';

export default async function FemaleRetentionPagePage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('female-retention');

  if (shellV2 && mode === 'v2') {
    return <FemaleRetentionPageV2 />;
  }

  return <FemaleRetentionPageLegacy />;
}
