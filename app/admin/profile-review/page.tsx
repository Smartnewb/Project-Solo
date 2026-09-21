import ProfileReviewV2 from './profile-review-v2';

// Re-export types for child components that import from '../page'
export type { PendingUser, PendingImage, CurrentProfileImage } from './profile-review-v2';

export default function ProfileReviewPage() {
  return <ProfileReviewV2 />;
}
