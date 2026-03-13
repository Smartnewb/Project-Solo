import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import CardNewsPageLegacy from './card-news-legacy';
import CardNewsPageV2 from './card-news-v2';

export default async function CardNewsPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('card-news');

  if (shellV2 && mode === 'v2') {
    return <CardNewsPageV2 />;
  }

  return <CardNewsPageLegacy />;
}
