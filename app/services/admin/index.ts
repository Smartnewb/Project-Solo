// Domain module imports
export { auth } from './auth';
export { stats, kpiReport } from './dashboard';
export { userAppearance, deletedFemales, userEngagement } from './users';
export { matching, forceMatching } from './matching';
export { pushNotifications, aiChat, momentQuestions } from './messaging';
export {
	backgroundPresets,
	cardNews,
	banners,
	sometimeArticles,
	appReviews,
	communityReviewArticles,
	publicReviews,
} from './content';
export { reports, userReview, profileImages } from './moderation';
export {
	gems,
	gemPricing,
	femaleRetention,
	chatRefund,
	appleRefund,
	likes,
	dormantLikes,
} from './revenue';
export { fcmTokens, universities } from './system';
export { featureFlags } from './feature-flags';
export type { FeatureFlag } from './feature-flags';

// Re-export interfaces for backward compatibility with named type imports
export type { FormattedData, StatItem, GenderStatItem } from './_shared';
export type {
	ReviewHistoryFilter,
	ReviewHistoryItem,
	VisionFaceAnnotation,
	ImageValidationResponse,
	ReviewHistoryResponse,
	PendingUsersFilter,
} from './moderation';
export type {
	AppReviewItem,
	CommunityReviewArticle,
	CommunityReviewArticlesResponse,
	AppReviewsResponse,
	AppReviewStatsResponse,
	AppReviewsParams,
	PublicReviewSource,
	PublicReviewItem,
	PublicReviewsResponse,
	FeaturedAppReviewsResponse,
} from './content';
export type {
	FcmTokenSummary,
	FcmTokenMeta,
	FcmTokenProfile,
	FcmTokenUserItem,
	FcmTokensResponse,
} from './system';

// Import all consts to assemble AdminService
import { auth } from './auth';
import { stats, kpiReport } from './dashboard';
import { userAppearance, deletedFemales, userEngagement } from './users';
import { matching, forceMatching } from './matching';
import { pushNotifications, aiChat, momentQuestions } from './messaging';
import {
	backgroundPresets,
	cardNews,
	banners,
	sometimeArticles,
	appReviews,
	communityReviewArticles,
	publicReviews,
} from './content';
import { reports, userReview, profileImages } from './moderation';
import {
	gems,
	gemPricing,
	femaleRetention,
	chatRefund,
	appleRefund,
	likes,
	dormantLikes,
} from './revenue';
import { fcmTokens, universities } from './system';
import { featureFlags } from './feature-flags';

const AdminService = {
	auth,
	stats,
	userAppearance,
	universities,
	matching,
	reports,
	profileImages,
	userReview,
	pushNotifications,
	aiChat,
	backgroundPresets,
	cardNews,
	femaleRetention,
	gems,
	gemPricing,
	deletedFemales,
	banners,
	dormantLikes,
	chatRefund,
	appleRefund,
	likes,
	momentQuestions,
	sometimeArticles,
	userEngagement,
	forceMatching,
	kpiReport,
	appReviews,
	communityReviewArticles,
	publicReviews,
	fcmTokens,
	getProfileReports: reports.getProfileReports,
	featureFlags,
};

export default AdminService;
