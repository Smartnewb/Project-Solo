import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import AppReviewsPageLegacy from './app-reviews-legacy';
import AppReviewsPageV2 from './app-reviews-v2';

export default async function AppReviewsPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('app-reviews');

  if (shellV2 && mode === 'v2') {
    return <AppReviewsPageV2 />;
  }

  return <AppReviewsPageLegacy />;
}
