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
export { notices } from './notices';
export type { NoticeListParams } from './notices';
export { seo } from './seo';
export type { PageMeta, SitemapKind } from './seo';
export { cardNewsGeneration } from './card-news-generation';
export { activities, campaigns, reviewQueue, metrics, personas, communitySettings, targetPosts } from './community-automation';
export type {
	CreateActivityBody,
	CreateActivityResult,
	ActivityReferenceMeta,
	Campaign,
	CampaignStatus,
	DagTemplateId,
	CreateCampaignBody,
	ListCampaignsQuery,
	TriggerDagRunBody,
	Content,
	ContentStatus,
	BulkApplyBody,
	BulkApplyResult,
	MetricsSummary,
	QueueDepth,
	DailyStat,
	GhostPersonaInfo,
	PersonaDiversityReport,
	CommunityTraits,
	CommunitySettings,
	KillSwitchStatus,
	ReactionSpeed,
	ActivityCurve,
	TargetPostListQuery,
	TargetPostSummary,
	TargetPostDetail,
	TargetPostComment,
	TargetPostGhostCandidate,
	TargetPostListResponse,
	CreateLlmDraftBody,
	CreateManualCommentBody,
	TargetPostDraftResult,
} from './community-automation';
export type { CardNewsTopic, QueueStats, JobStatus } from './card-news-generation';
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
	UtmAttributionHealth,
	UtmDashboardSurfaces,
	UtmReconciliationResponse,
	UtmReconciliationRow,
	UtmPlatformBinding,
	UtmDrilldownRow,
	UtmConversionExportRow,
	UtmConversionExportResponse,
	UtmLinkFlow,
} from './utm';
export { ghostInjection } from './ghost-injection';
export { ghostChat } from './ghost-chat';
export { somemateChat } from './somemate-chat';
export { ghostReferencePool } from './ghost-reference-pool';
export { aiProfileGenerator } from './ai-profile-generator';
export { promotions } from './promotions';
export { incentiveCampaign } from './incentive-campaign';
export { gemProducts } from './gem-products';
export { iapCatalog } from './iap-catalog';
export { aiProfileReferences } from './ai-profile-references';
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
export type {
	CampaignCalendarAssignment,
	CampaignCalendarDay,
	CampaignCalendarFemaleGroup,
	CampaignCalendarMaleProfile,
	CampaignCalendarResponse,
	CampaignCalendarUserSummary,
} from './incentive-campaign';

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
import { notices } from './notices';
import { seo } from './seo';
import { cardNewsGeneration } from './card-news-generation';
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
import { ghostChat } from './ghost-chat';
import { somemateChat } from './somemate-chat';
import { ghostReferencePool } from './ghost-reference-pool';
import { aiProfileGenerator } from './ai-profile-generator';
import { promotions } from './promotions';
import { incentiveCampaign } from './incentive-campaign';
import { gemProducts } from './gem-products';
import { iapCatalog } from './iap-catalog';
import { activities, campaigns, reviewQueue, metrics, personas, communitySettings, targetPosts } from './community-automation';
import { XMarketingAdminService } from './x-marketing';

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
	notices,
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
	ghostChat,
	somemateChat,
	ghostReferencePool,
	aiProfileGenerator,
	promotions,
	incentiveCampaign,
	gemProducts,
	iapCatalog,
	seo,
	cardNewsGeneration,
	campaigns,
	activities,
	reviewQueue,
	metrics,
	personas,
	communitySettings,
	targetPosts,
	xMarketing: XMarketingAdminService,
};

export default AdminService;
export * from './x-marketing';
