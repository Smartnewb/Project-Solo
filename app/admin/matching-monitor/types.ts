// --- Dashboard Response ---

export interface MatchingDashboardResponse {
	period: 'today' | '7d' | '30d';
	country: 'KR' | 'JP' | 'ALL';
	cachedAt: string;
	pool: PoolOverview;
	matchRate: MatchRate;
	postMatchFunnel: PostMatchFunnel;
	chatEngagement: ChatEngagement;
	periodComparison: PeriodComparison;
	matchDetails: MatchDetail[];
	pipelineTransparency: PipelineTransparency;
	regionStats: RegionStat[];
	segmentStats: SegmentStat[];
	batchPerformance: BatchPerformance;
	atRiskUsers: AtRiskUsers;
	globalMatching: GlobalMatching;
	historyTtl: HistoryTtl;
	healthScore: HealthScore;
}

export interface PoolOverview {
	totalEligible: number;
	activeUsers30d: number;
	maleCount: number;
	femaleCount: number;
	genderRatio: string;
	byRank: { S: number; A: number; B: number; C: number; UNKNOWN: number };
	prefOptionZeroCount: number;
}

export interface MatchRate {
	totalCreated: number;
	scheduledCount: number;
	normalCount: number;
	globalCount: number;
	avgCompatibilityScore: number | null;
	periodFrom: string;
	periodTo: string;
}

export interface PostMatchFunnel {
	matchesCreated: number;
	likesSent: number;
	likesWithLetter: number;
	mutualAccepted: number;
	chatRoomsOpened: number;
	chatRoomsActive: number;
	likeExpired: number;
	likeRejected: number;
	letterRate: number;
	mutualAcceptRate: number;
	chatOpenRate: number;
}

export interface PipelineFilterStat {
	filterName: string;
	totalEliminated: number;
	avgEliminationRate: number;
}

export interface RelaxationStepStat {
	step: number;
	count: number;
}

export interface PipelineTransparency {
	totalFailureLogs: number;
	byFilter: PipelineFilterStat[];
	byRelaxationStep: RelaxationStepStat[];
	avgCandidatesBeforeFilter: number;
	avgCandidatesAfterFilter: number;
	zeroCandidateCount: number;
}

export interface RegionStat {
	region: string;
	failureCount: number;
	avgPoolInRegion: number;
	avgPoolInMetro: number;
	avgPoolNationwide: number;
	zeroCandidateCount: number;
}

export interface SegmentStat {
	rank: string;
	maleCount: number;
	femaleCount: number;
}

export interface BatchPerformance {
	totalBatches: number;
	completedBatches: number;
	failedBatches: number;
	avgSuccessCount: number;
	avgFailureCount: number;
	avgDurationMs: number | null;
}

export interface AtRiskUser {
	userId: string;
	name: string;
	gender: 'MALE' | 'FEMALE';
	consecutiveFailureDays: number;
	lastFailureReason: string;
	lastFailedAt: string;
}

export interface AtRiskUsers {
	riskUsers3d: AtRiskUser[];
	riskUsers7d: AtRiskUser[];
	zeroCandidateUsers: number;
	topFailureReasons: { reason: string; count: number }[];
}

export interface GlobalMatching {
	krToJpAttempted: number;
	krToJpSuccess: number;
	jpToKrAttempted: number;
	jpToKrSuccess: number;
	pendingLikes: number;
	expiredLikesInPeriod: number;
}

export interface HistoryTtl {
	ttlDays: number;
	expiredInPeriod: number;
	currentActiveExclusions: number;
}

export interface HealthAlert {
	level: 'info' | 'warn' | 'critical';
	metric: string;
	message: string;
}

export interface HealthScore {
	score: number;
	grade: 'HEALTHY' | 'CAUTION' | 'CRITICAL';
	alerts: HealthAlert[];
}

// --- Chat Engagement ---

export interface ChatEngagement {
	totalRooms: number;
	roomsWithMessages: number;
	mutualChatRooms: number;
	avgMessagesPerRoom: number | null;
	avgMinutesToFirstMessage: number | null;
	totalMessages: number;
	messageRate: number;
	mutualChatRate: number;
}

// --- Period Comparison ---

export interface PeriodComparisonMetric {
	current: number;
	previous: number;
	deltaPercent: number | null;
}

export interface PeriodComparison {
	previousPeriodFrom: string;
	previousPeriodTo: string;
	matchesCreated: PeriodComparisonMetric;
	likesSent: PeriodComparisonMetric;
	mutualAccepted: PeriodComparisonMetric;
	chatRoomsOpened: PeriodComparisonMetric;
}

// --- Match Details ---

export interface MatchDetail {
	connectionId: string;
	matchType: 'scheduled' | 'rematching' | 'profile_viewer' | 'admin';
	publishedAt: string;
	maleName: string;
	femaleName: string;
	likeStatus: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED' | null;
	hasLetter: boolean;
	hasChatRoom: boolean;
	chatActive: boolean;
	activity24hStatus: 'mutual' | 'one_sided' | 'inactive' | null;
	messageCount: number;
	lastMessageAt: string | null;
}

// --- User Diagnosis ---

export interface UserPoolVisibility {
	eligibleOpponents: number;
	excludedByHistory: number;
	netEligible: number;
}

export interface FailureHistoryItem {
	failedAt: string;
	failureCategory: string;
	failureCode: string;
	failureReason: string;
	matchType: string;
	pipelineStep: string;
	maxRelaxationLevel: number | null;
	candidatesBeforeFilter: number | null;
	candidatesAfterFilter: number | null;
	poolInRegion: number | null;
	poolInMetro: number | null;
	poolNationwide: number | null;
	eliminatedByUniversity: number | null;
	eliminatedByDepartment: number | null;
	eliminatedByContactBlock: number | null;
}

export interface UserDiagnosisResponse {
	userId: string;
	consecutiveFailureDays: number;
	poolVisibility: UserPoolVisibility;
	failureHistory: FailureHistoryItem[];
	totalFailures30d: number;
	dominantFailureReason: string | null;
}

// --- Query params ---

export type DashboardPeriod = 'today' | '7d' | '30d';
export type DashboardCountry = 'KR' | 'JP' | 'ALL';
