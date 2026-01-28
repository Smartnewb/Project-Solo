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
  startDate: string;
  endDate: string;
  cachedAt: string;
  nextUpdateAt: string;
  scheduled: MatchTypeStats;
  rematching: MatchTypeStats;
}

export interface MatchTypeStats {
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
  overallMutualLikeRate: number;
  /** 좋아요 전환율 (상호 좋아요 / 한쪽이라도 좋아요한 매칭) */
  overallLikeConversionRate: number;
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
  /** 한쪽이라도 좋아요한 매칭 수 */
  matchesWithAnyLike: number;
  mutualLikes: number;
  /** 상호 좋아요 비율 (mutualLikes / totalMatches) */
  mutualLikeRate: number;
  /** 좋아요 전환율 (mutualLikes / matchesWithAnyLike) */
  likeConversionRate: number;
  chatConversions: number;
  matchToChatRate: number;
  /** 포맷: "+8.5%", "-3.2%" */
  mutualLikeTrend: string;
  /** 포맷: "+8.5%", "-3.2%" */
  likeConversionTrend: string;
  /** 포맷: "+8.5%", "-3.2%" */
  matchToChatTrend: string;
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

export type UniversityType = 'UNIVERSITY' | 'COLLEGE';

export interface RegionMetaItem {
  code: string;
  nameLocal: string;
  name: string;
}

export interface TypeMetaItem {
  code: string;
  name: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code?: string;
  nameEn?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UniversityItem {
  id: string;
  name: string;
  region: string;
  regionName?: string;
  code?: string;
  en?: string;
  type: UniversityType;
  foundation?: string;
  logoUrl?: string;
  isActive: boolean;
  departmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UniversityDetail extends UniversityItem {
  departments: DepartmentSummary[];
}

export interface UniversityListResponse {
  items: UniversityItem[];
  meta: PaginationMeta;
}

export interface UniversityListParams {
  page?: number;
  limit?: number;
  name?: string;
  region?: string;
  isActive?: boolean;
  type?: UniversityType;
  sortBy?: 'name' | 'createdAt' | 'region';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUniversityRequest {
  name: string;
  region: string;
  code?: string;
  en?: string;
  type: UniversityType;
  foundation?: string;
  isActive?: boolean;
}

export interface UpdateUniversityRequest {
  name?: string;
  region?: string;
  code?: string;
  en?: string;
  type?: UniversityType;
  foundation?: string;
  isActive?: boolean;
}

export interface DepartmentItem {
  id: string;
  universityId: string;
  name: string;
  code?: string;
  nameEn?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentListResponse {
  items: DepartmentItem[];
  meta: PaginationMeta;
}

export interface DepartmentListParams {
  page?: number;
  limit?: number;
  name?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'displayOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDepartmentRequest {
  name: string;
  code?: string;
  nameEn?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  nameEn?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface BulkCreateDepartmentsRequest {
  departments: CreateDepartmentRequest[];
}

export interface BulkCreateDepartmentsResponse {
  created: number;
  message: string;
}

export interface UploadLogoResponse {
  success: boolean;
  logoUrl: string;
  message: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface UploadDepartmentsCsvResponse {
  success: boolean;
  deleted: number;
  created: number;
  message: string;
  warnings?: string[];
}

// Likes 관련 타입
export type LikeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface AdminLikesParams {
  page?: number;
  limit?: number;
  status?: LikeStatus;
  hasLetter?: boolean;
  isMutualLike?: boolean;
  senderUserId?: string;
  forwardUserId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'viewedAt' | 'mutualLikeAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LikeUserInfo {
  userId: string;
  name: string;
  age: number;
  mainImageUrl: string | null;
  university: string;
}

export interface LikeDetail {
  id: string;
  connectionId: string;
  sender: LikeUserInfo;
  forwardUser: LikeUserInfo;
  status: LikeStatus;
  createdAt: string;
  viewedAt: string | null;
  hasLetter: boolean;
  letterContent: string | null;
  isMutualLike: boolean;
  mutualLikeAt: string | null;
  reverseLikeId: string | null;
  matchId: string;
  matchExpiredAt: string;
  isMatchExpired: boolean;
}

export interface AdminLikesResponse {
  items: LikeDetail[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Sometime Article Types
export type SometimeArticleStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type SometimeArticleCategory = 'story' | 'interview' | 'tips' | 'team' | 'update' | 'safety';

export interface SometimeMediaAsset {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface SometimeArticleAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface SometimeArticleSEO {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string[];
}

export interface AdminSometimeArticleItem {
  id: string;
  slug: string;
  status: SometimeArticleStatus;
  category: SometimeArticleCategory;
  title: string;
  subtitle?: string;
  excerpt?: string;
  thumbnail?: SometimeMediaAsset;
  author?: SometimeArticleAuthor;
  viewCount: number;
  publishedAt: string | null;
}

export interface AdminSometimeArticleDetail extends AdminSometimeArticleItem {
  content: string;
  coverImage?: SometimeMediaAsset;
  shareCount: number;
  seo?: SometimeArticleSEO;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSometimeArticleListResponse {
  items: AdminSometimeArticleItem[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateSometimeArticleRequest {
  slug: string;
  status?: SometimeArticleStatus;
  category: SometimeArticleCategory;
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  thumbnail?: SometimeMediaAsset;
  coverImage?: SometimeMediaAsset;
  author: SometimeArticleAuthor;
  seo?: SometimeArticleSEO;
  publishedAt?: string;
}

export interface UpdateSometimeArticleRequest {
  slug?: string;
  status?: SometimeArticleStatus;
  category?: SometimeArticleCategory;
  title?: string;
  subtitle?: string;
  content?: string;
  excerpt?: string;
  thumbnail?: SometimeMediaAsset;
  coverImage?: SometimeMediaAsset;
  author?: SometimeArticleAuthor;
  seo?: SometimeArticleSEO;
  publishedAt?: string;
}
