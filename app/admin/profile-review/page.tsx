import { getRouteMode, isAdminShellV2Enabled } from '@/shared/feature-flags';
import ProfileReviewLegacy from './profile-review-legacy';
import ProfileReviewV2 from './profile-review-v2';

// Re-export types for child components that import from '../page'
export type { PendingUser, PendingImage, CurrentProfileImage } from './profile-review-legacy';

export default async function ProfileReviewPage() {
  const shellV2 = await isAdminShellV2Enabled();
  const mode = await getRouteMode('profile-review');

  if (shellV2 && mode === 'v2') {
    return <ProfileReviewV2 />;
  }

  return <ProfileReviewLegacy />;
}
