// Domain module imports
export { stats, kpiReport } from './dashboard';
export { userAppearance, deletedFemales, userEngagement } from './users';
export { matching, forceMatching } from './matching';
export { pushNotifications, pushNotificationCatalog, aiChat, momentQuestions } from './messaging';
export type {
	PushNotificationCatalogResponse,
	PushNotificationItem,
	PushNotificationTemplate,
	PushNotificationVariant,
	FreshmenMilestone,
} from './messaging';
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
export { revenueV2 } from './revenue-v2';
export type { RevenueSummary, RevenueBreakdown, DailyRevenueTrend } from './revenue-v2';
export { blacklist, usersStats } from './blacklist';
export type {
	BlacklistItem,
	BlacklistHistoryEntry,
	BlacklistRegisterRequest,
	BlacklistReleaseRequest,
	BlacklistRegisterResponse,
	BlacklistReleaseResponse,
	BlacklistListParams,
	UsersStatsResponse,
	PaginationMeta,
} from './blacklist';
export { fcmTokens, universities } from './system';
export { featureFlags } from './feature-flags';
export type { FeatureFlag } from './feature-flags';
export { matchingMonitor } from './matching-monitor';
export { styleReference } from './style-reference';
export { care } from './care';
export { keywords } from './keywords';
export { KEYWORD_CATEGORIES } from './keywords';
export { utm } from './utm';
export type {
	UtmLink,
	UtmDashboardSummary,
	UtmFunnelStep,
	UtmChannelRow,
	UtmCampaignRow,
} from './utm';
export { ghostInjection } from './ghost-injection';
export { ghostReferencePool } from './ghost-reference-pool';
export type { KeywordCategory, KeywordItem, KeywordsResponse } from './keywords';
export type {
	CareTarget,
	CareTargetsResponse,
	CarePartner,
	CareExecuteRequest,
	CareExecuteResponse,
	CareLog,
	CareLogsResponse,
} from './care';
export type {
	StyleReferenceItem,
	StyleReferenceListResponse,
	StyleReferenceStats,
	StyleReferenceStatsItem,
	CreateStyleReferenceRequest,
	BulkCreateResult,
	StyleReferenceListParams,
} from './style-reference';

// Re-export interfaces for backward compatibility with named type imports
export type { FormattedData, StatItem, GenderStatItem } from './_shared';
export type {
	ReviewHistoryFilter,
	ReviewHistoryItem,
	ReportAction,
	ReportHistoryEntry,
	ReportTargetType,
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
import { stats, kpiReport } from './dashboard';
import { userAppearance, deletedFemales, userEngagement } from './users';
import { matching, forceMatching } from './matching';
import { pushNotifications, pushNotificationCatalog, aiChat, momentQuestions } from './messaging';
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
import { revenueV2 } from './revenue-v2';
import { fcmTokens, universities } from './system';
import { featureFlags } from './feature-flags';
import { matchingMonitor } from './matching-monitor';
import { styleReference } from './style-reference';
import { care } from './care';
import { keywords } from './keywords';
import { utm } from './utm';
import { ghostInjection } from './ghost-injection';
import { ghostReferencePool } from './ghost-reference-pool';

const AdminService = {
	stats,
	userAppearance,
	universities,
	matching,
	reports,
	profileImages,
	userReview,
	pushNotifications,
	pushNotificationCatalog,
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
	matchingMonitor,
	styleReference,
	care,
	keywords,
	revenueV2,
	utm,
	ghostInjection,
	ghostReferencePool,
};

export default AdminService;
