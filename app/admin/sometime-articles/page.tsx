import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import SometimeArticlesPageLegacy from './sometime-articles-legacy';
import SometimeArticlesPageV2 from './sometime-articles-v2';

export default async function SometimeArticlesPagePage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('sometime-articles');

  if (shellV2 && mode === 'v2') {
    return <SometimeArticlesPageV2 />;
  }

  return <SometimeArticlesPageLegacy />;
}
