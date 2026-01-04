export interface BackgroundPreset {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  order: number;
}

export interface BackgroundImage {
  type: 'PRESET' | 'CUSTOM';
  preset?: BackgroundPreset;
  presetName?: string;
  customUrl?: string;
  url?: string;
}

export interface Category {
  id: string;
  displayName: string;
  code: string;
  emojiUrl: string;
}

export interface CardSection {
  id?: string;
  order: number;
  title: string;
  content: string;
  imageUrl?: string;
}

export interface AdminCardNewsItem {
  id: string;
  title: string;
  description?: string;
  postType: string;
  category: Category;
  backgroundImage?: BackgroundImage;
  hasReward: boolean;
  sections?: CardSection[];
  readCount: number;
  pushNotificationTitle?: string;
  pushNotificationMessage?: string;
  pushSentAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCardNewsListResponse {
  items: AdminCardNewsItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCardNewsRequest {
  title: string;
  description?: string;
  categoryCode: string;
  backgroundImage?: {
    type: 'PRESET' | 'CUSTOM';
    presetId?: string;
    customUrl?: string;
  };
  hasReward: boolean;
  sections: Array<{
    order: number;
    title: string;
    content: string;
    imageUrl?: string;
  }>;
  pushNotificationTitle?: string;
  pushNotificationMessage?: string;
}

export interface UpdateCardNewsRequest {
  title?: string;
  description?: string;
  backgroundImage?: {
    type: 'PRESET' | 'CUSTOM';
    presetId?: string;
    customUrl?: string;
  };
  hasReward?: boolean;
  sections?: Array<{
    order: number;
    title: string;
    content: string;
    imageUrl?: string;
  }>;
  pushNotificationTitle?: string;
  pushNotificationMessage?: string;
}

export interface PublishCardNewsRequest {
  pushNotificationTitle?: string;
  pushNotificationMessage?: string;
}

export interface PublishCardNewsResponse {
  success: boolean;
  sentCount: number;
  message: string;
}

export interface UploadImageResponse {
  url: string;
  message?: string;
}

export interface CreatePresetRequest {
  name: string;
  displayName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  order?: number;
}

export interface UploadAndCreatePresetRequest {
  name: string;
  displayName: string;
  order?: number;
}

export interface BackgroundPresetsResponse {
  data: BackgroundPreset[];
}

export type BannerPosition = 'home' | 'moment';
export type BannerActionType = 'internal' | 'external' | null;

export interface Banner {
  id: string;
  imageUrl: string;
  actionUrl: string | null;
  actionType: BannerActionType;
  position: BannerPosition;
  order: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface CreateBannerRequest {
  position: BannerPosition;
  actionUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateBannerRequest {
  actionUrl?: string;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateBannerOrderRequest {
  banners: Array<{ id: string; order: number }>;
}

export interface DeletedFemale {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  gender: 'FEMALE';
  deletedAt: string;
  profileId: string | null;
}

export interface DeletedFemalesListResponse {
  items: DeletedFemale[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RestoreFemaleResponse {
  id: string;
  email: string;
  temporaryPassword: string;
  isRetentionUser: boolean;
  restoredAt: string;
}

export interface SleepFemaleResponse {
  id: string;
  deletedAt: string;
}

export interface DormantUserResponse {
  id: string;
  name: string;
  phoneNumber: string;
  gemBalance: number;
  lastLoginAt: string | null;
  daysSinceLastLogin: number;
  pendingLikeCount: number;
  canProcess: boolean;
  cooldownRemainingMinutes: number | null;
}

export interface DormantLikesDashboardResponse {
  totalPendingLikes: number;
  todayProcessedCount: number;
  todayViewedCount: number;
  todayRejectedCount: number;
  users: DormantUserResponse[];
  totalUsers: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DormantLikeDetailResponse {
  matchLikeId: string;
  connectionId: string;
  senderUserId: string;
  senderName: string;
  senderAge: number;
  senderUniversity: string;
  senderMainImageUrl: string | null;
  likedAt: string;
  daysSinceLiked: number;
}

export interface CooldownStatusResponse {
  isOnCooldown: boolean;
  remainingMinutes: number;
  lastProcessedAt: string | null;
  canProcessAt: string | null;
}

export interface ProcessLikeDetail {
  matchLikeId: string;
  actionType: 'VIEW' | 'REJECT';
  success: boolean;
  error?: string;
}

export interface ProcessLikesRequest {
  dormantUserId: string;
  matchLikeIds: string[];
  rejectionRate?: number;
  note?: string;
}

export interface ProcessLikesResponse {
  batchId: string;
  processedCount: number;
  viewedCount: number;
  rejectedCount: number;
  details: ProcessLikeDetail[];
}

export interface ViewProfileRequest {
  viewerId: string;
  viewedUserId: string;
}

export interface ViewProfileResponse {
  success: boolean;
  matchId: string;
  isFirstView: boolean;
  notificationSent: boolean;
}

export interface ActionLogResponse {
  id: string;
  adminUserName: string;
  dormantUserName: string;
  actionType: 'VIEW' | 'REJECT';
  batchId: string;
  delayMinutes: number;
  createdAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ActionLogsResponse {
  items: ActionLogResponse[];
  meta: PaginationMeta;
}

export interface RefundUserSearchResult {
  userId: string;
  name: string;
  phoneNumber: string;
}

export interface RefundUserSearchResponse {
  users: RefundUserSearchResult[];
}

export interface EligibleChatRoomPartnerInfo {
  name: string;
  university: string;
  profileImageUrl?: string;
}

export interface EligibleChatRoom {
  chatRoomId: string;
  partnerInfo: EligibleChatRoomPartnerInfo;
  createdAt: string;
  totalMessageCount: number;
  isRefunded: boolean;
}

export interface EligibleChatRoomsResponse {
  eligibleRooms: EligibleChatRoom[];
}

export type RefundReasonCode = 'A' | 'B' | 'C' | 'D';

export interface RefundPreviewRequest {
  userId: string;
  chatRoomId: string;
  refundReasonCode: RefundReasonCode;
}

export interface RefundPreviewResponse {
  userName: string;
  phoneNumber: string;
  refundGemAmount: number;
  smsContent: string;
  refundReasonCode: string;
  refundReasonText: string;
}

export interface ProcessRefundRequest {
  userId: string;
  chatRoomId: string;
  refundReasonCode: RefundReasonCode;
  smsContent: string;
}

export interface ProcessRefundResponse {
  success: boolean;
  gemTransactionId: string;
  smsSentAt?: string;
  smsError?: string;
}

export enum AppleRefundStatus {
  NONE = 'NONE',
  REFUNDED = 'REFUNDED',
}

export interface AppleRefundItem {
  id: string;
  userId: string;
  userName: string;
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: string;
  refundDate: string | null;
  refundStatus: AppleRefundStatus;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppleRefundListResponse {
  items: AppleRefundItem[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AppleRefundListParams {
  page?: number;
  limit?: number;
  status?: AppleRefundStatus;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export type MatchingPoolCountry = 'KR' | 'JP';

export interface MatchingPoolStatsResponse {
  country: MatchingPoolCountry;
  cachedAt: string;
  nextUpdateAt: string;
  summary: MatchingPoolSummaryStats;
  regions: MatchingPoolRegionStats[];
}

export interface MatchingPoolSummaryStats {
  totalUsers: number;
  maleCount: number;
  femaleCount: number;
  /** 성비 (남/여). female=0인 경우 null 반환 */
  genderRatio: number | null;
  avgAge: number;
  avgProfileCompleteness: number;
  overallMatchToChatRate: number;
}

export interface MatchingPoolRegionStats {
  regionCode: string;
  regionName: string;
  coordinates: MatchingPoolCoordinates;
  users: MatchingPoolUserStats;
  ageDistribution: MatchingPoolAgeDistribution;
  universities: MatchingPoolUniversityStats;
  profileCompleteness: MatchingPoolProfileCompleteness;
  matchingStats: MatchingPoolMatchingStats;
  hourlyActivity: MatchingPoolHourlyActivity;
}

export interface MatchingPoolCoordinates {
  lat: number;
  lng: number;
}

export interface MatchingPoolUserStats {
  total: number;
  male: number;
  female: number;
  /** 성비 (남/여). female=0인 경우 null 반환 */
  genderRatio: number | null;
}

export interface MatchingPoolAgeGroup {
  count: number;
  male: number;
  female: number;
}

export interface MatchingPoolAgeDistribution {
  '20-22': MatchingPoolAgeGroup;
  '23-25': MatchingPoolAgeGroup;
  '26-28': MatchingPoolAgeGroup;
  '29+': MatchingPoolAgeGroup;
}

export interface MatchingPoolUniversityItem {
  id: string;
  name: string;
  count: number;
  male: number;
  female: number;
}

export interface MatchingPoolUniversityStats {
  topUniversities: MatchingPoolUniversityItem[];
  totalUniversities: number;
  otherCount: number;
}

export interface MatchingPoolCompletenessGroup {
  range: string;
  count: number;
  percentage: number;
}

export interface MatchingPoolProfileCompleteness {
  incomplete: MatchingPoolCompletenessGroup;
  basic: MatchingPoolCompletenessGroup;
  complete: MatchingPoolCompletenessGroup;
}

export interface MatchingPoolMatchingStats {
  totalMatches: number;
  chatConversions: number;
  matchToChatRate: number;
  /** 전주 대비 변화율 (포맷팅된 문자열, 예: "+8.5%", "-3.2%") */
  trend: string;
}

export type MatchingPoolActivityRank = 'high' | 'medium' | 'low';

export interface MatchingPoolHourlyActivity {
  peakHours: number[];
  lowHours: number[];
  currentHourRank: MatchingPoolActivityRank;
  /** 시간대별 활동 점수 (0-23시, 값: 0-100) */
  distribution: Record<string, number>;
}

export type KoreaRegionCode =
  | 'SEL' | 'BSN' | 'DGU' | 'ICN' | 'GWJ' | 'DJN' | 'ULS' | 'SJG'
  | 'KYG' | 'GNG' | 'CCN' | 'CAN' | 'JJU' | 'YSU' | 'PHG' | 'CWN' | 'JJA';

export type JapanRegionCode =
  | 'TOKYO' | 'OSAKA' | 'KANAGAWA' | 'AICHI' | 'SAITAMA'
  | 'CHIBA' | 'HYOGO' | 'HOKKAIDO' | 'FUKUOKA' | 'KYOTO';
