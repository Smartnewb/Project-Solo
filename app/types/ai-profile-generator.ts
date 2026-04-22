export type AiProfileDraftScope = 'admin_curated' | 'user_custom';
export type AiProfileDraftStatus =
  | 'draft'
  | 'generating'
  | 'failed'
  | 'published'
  | 'archived';

export type AiProfileDomain =
  | 'seed'
  | 'basic'
  | 'appearanceFace'
  | 'appearanceStyle'
  | 'personalityCore'
  | 'relationshipPsychology'
  | 'interestsLifestyle'
  | 'valuesBackstory'
  | 'voice'
  | 'chatBehavior'
  | 'photoPrompt';

export const MVP_DOMAINS: AiProfileDomain[] = [
  'seed',
  'basic',
  'personalityCore',
  'relationshipPsychology',
  'voice',
  'chatBehavior',
];

export const FULL_DOMAINS: AiProfileDomain[] = [
  'seed',
  'basic',
  'appearanceFace',
  'appearanceStyle',
  'personalityCore',
  'relationshipPsychology',
  'interestsLifestyle',
  'valuesBackstory',
  'voice',
  'chatBehavior',
  'photoPrompt',
];

export type AiProfileDomainGroup =
  | 'seed'
  | 'identity'
  | 'appearance'
  | 'personality'
  | 'behavior'
  | 'photo';

export const DOMAIN_GROUP_ORDER: AiProfileDomainGroup[] = [
  'seed',
  'identity',
  'appearance',
  'personality',
  'behavior',
  'photo',
];

export const DOMAIN_GROUP_LABEL: Record<AiProfileDomainGroup, string> = {
  seed: '시드',
  identity: '기본 정보',
  appearance: '외형',
  personality: '성격 & 관계',
  behavior: '말투 & 행동',
  photo: '사진',
};

export const DOMAIN_TO_GROUP: Record<AiProfileDomain, AiProfileDomainGroup> = {
  seed: 'seed',
  basic: 'identity',
  appearanceFace: 'appearance',
  appearanceStyle: 'appearance',
  personalityCore: 'personality',
  relationshipPsychology: 'personality',
  interestsLifestyle: 'personality',
  valuesBackstory: 'personality',
  voice: 'behavior',
  chatBehavior: 'behavior',
  photoPrompt: 'photo',
};

export const DOMAIN_LABEL: Record<AiProfileDomain, string> = {
  seed: '시드',
  basic: '기본 정보',
  appearanceFace: '얼굴',
  appearanceStyle: '스타일',
  personalityCore: '성격',
  relationshipPsychology: '관계 심리',
  interestsLifestyle: '관심사/라이프스타일',
  valuesBackstory: '가치관/배경',
  voice: '말투',
  chatBehavior: '대화 행동',
  photoPrompt: '사진 프롬프트',
};

export type AiProfileDomainStatus =
  | 'empty'
  | 'generating'
  | 'ready'
  | 'stale'
  | 'blocked'
  | 'failed';

export interface AiProfileValidationWarning {
  domain: AiProfileDomain | 'global';
  severity: 'low' | 'medium' | 'high';
  code: string;
  message: string;
}

export interface AiProfilePhoto {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  moderationStatus: 'pending' | 'approved' | 'blocked' | 'failed';
  source: 'generated' | 'manual';
  generator?: string;
  createdAt: string;
}

export interface AiProfileDraft {
  id: string;
  scope: AiProfileDraftScope;
  status: AiProfileDraftStatus;
  adminUserId: string;
  ownerUserId: string | null;
  templateId: string | null;
  templateVersion: number | null;
  domains: Partial<Record<AiProfileDomain, unknown>>;
  domainStatus: Record<AiProfileDomain, AiProfileDomainStatus>;
  validation: {
    warnings: AiProfileValidationWarning[];
    blockedFlags: string[];
    lastValidatedAt: string | null;
  };
  generationCost: Record<string, unknown>;
  controlPolicy: Record<string, unknown>;
  lockedFields: Partial<Record<AiProfileDomain, string[]>>;
  sourceDataSnapshot: Record<string, unknown>;
  publishedCompanionId: string | null;
  representativeImageUrl: string | null;
  gallery: AiProfilePhoto[];
  version: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface AiProfileDraftListQuery {
  status?: AiProfileDraftStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AiProfileDraftListResponse {
  items: AiProfileDraft[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDraftBody {
  templateId?: string;
  seedHint?: string;
}

export interface PatchDraftBody {
  expectedVersion: number;
  lockedFields?: Partial<Record<AiProfileDomain, string[]>>;
  controlPolicy?: Record<string, unknown>;
}

export interface GenerateDomainBody {
  expectedVersion: number;
  instructionOverride?: string;
}

export interface PatchDomainBody {
  expectedVersion: number;
  payload: unknown;
}

export interface ApplyTemplateBody {
  expectedVersion: number;
  templateId: string;
}

export interface AiProfileTemplate {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: 'active' | 'archived';
  baseInstruction: string;
  domainInstructions: Record<string, string> | null;
  lockedFields: Partial<Record<AiProfileDomain, string[]>> | null;
  randomizationPolicy: Record<string, unknown> | null;
  sourceDataPolicy: Record<string, unknown> | null;
  imagePolicy: Record<string, unknown> | null;
  safetyPolicy: Record<string, unknown> | null;
  domainBlueprints: Record<string, unknown> | null;
  promptVersionId: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface AiProfileTemplateListResponse {
  items: AiProfileTemplate[];
  total: number;
}

export interface TemplateListQuery {
  status?: 'active' | 'archived' | 'all';
  q?: string;
  page?: number;
  limit?: number;
}

export interface TemplateListResponse {
  items: AiProfileTemplate[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTemplateBody {
  name: string;
  description?: string;
  baseInstruction: string;
  domainInstructions?: Record<string, string>;
  lockedFields?: Partial<Record<AiProfileDomain, string[]>>;
  randomizationPolicy?: Record<string, unknown>;
  sourceDataPolicy?: Record<string, unknown>;
  imagePolicy?: Record<string, unknown>;
  safetyPolicy?: Record<string, unknown>;
  domainBlueprints?: Record<string, unknown>;
  promptVersionId?: string;
}

export interface UpdateTemplateBody extends Partial<CreateTemplateBody> {
  expectedVersion: number;
}

export interface PromptVersionConfig {
  globalInstruction: string;
  domainInstructions?: Record<string, string>;
  safetyInstruction?: string;
  repairInstruction?: string;
  temperatureByDomain?: Record<string, number>;
}

export type PromptVersionStatus = 'draft' | 'active' | 'archived';

export interface PromptVersion {
  id: string;
  name: string;
  description: string | null;
  status: PromptVersionStatus;
  config: PromptVersionConfig;
  version: number;
  createdByAdminUserId: string;
  createdAt: string;
  updatedAt: string | null;
  activatedAt: string | null;
}

export interface PromptVersionListQuery {
  status?: PromptVersionStatus | 'all';
  q?: string;
  page?: number;
  limit?: number;
}

export interface PromptVersionListResponse {
  items: PromptVersion[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePromptVersionBody {
  name: string;
  description?: string;
  config: PromptVersionConfig;
}

export interface UpdatePromptVersionBody {
  expectedVersion: number;
  name?: string;
  description?: string;
  config?: PromptVersionConfig;
}

export type PhotoStyle = 'portrait' | 'casual' | 'custom';

export interface GeneratePhotoBody {
  expectedVersion: number;
  style?: PhotoStyle;
  customPrompt?: string;
}

export interface SetRepresentativeImageBody {
  expectedVersion: number;
  photoId: string;
}

export interface PublishDryRunBody {
  expectedVersion: number;
}

export interface PublishDryRunResponse {
  companionPreview: Record<string, unknown>;
  warnings: AiProfileValidationWarning[];
  blocked: boolean;
  blockedReasons: string[];
}

export interface PublishBody {
  expectedVersion: number;
  acknowledgeWarnings?: boolean;
}

export interface PublishResponse {
  companionId: string;
  draft: AiProfileDraft;
}

export interface PreviewChatBody {
  userMessages: string[];
}

export interface PreviewChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface PreviewChatResponse {
  turns: PreviewChatTurn[];
  tokensUsed?: number;
}

export interface UploadPhotoBody {
  file: File;
  expectedVersion: number;
  setAsRepresentative?: boolean;
}

export interface RetryPhotoBody {
  expectedVersion: number;
  customPrompt?: string;
}

export interface RejectPhotoBody {
  expectedVersion: number;
  reason: string;
}

// ───────── Phase 5: structured policy types ─────────

export const CAMPUS_AREAS = [
  'SEOUL',
  'GYEONGGI',
  'INCHEON',
  'BUSAN',
  'DAEGU',
  'DAEJEON',
  'GWANGJU',
  'OTHER',
] as const;
export type CampusArea = (typeof CAMPUS_AREAS)[number];

export const GENDER_PRESENTATIONS = ['female', 'male', 'any'] as const;
export type GenderPresentation = (typeof GENDER_PRESENTATIONS)[number];

export const FALLBACK_STRATEGIES = ['random', 'nearest', 'skip'] as const;
export type FallbackStrategy = (typeof FALLBACK_STRATEGIES)[number];

export interface SourceDataPolicyKnown {
  universityIds?: string[];
  departmentIds?: string[];
  campusAreas?: CampusArea[];
  ageRange?: { min?: number; max?: number };
  genderPresentation?: GenderPresentation;
  minReferenceCount?: number;
  fallbackStrategy?: FallbackStrategy;
}

export const IMAGE_PROVIDERS = ['imagen', 'openai', 'auto'] as const;
export type ImageProviderHint = (typeof IMAGE_PROVIDERS)[number];

export const IMAGE_RESOLUTIONS = [
  '1024x1024',
  '768x1024',
  '1024x768',
  'custom',
] as const;
export type ImageResolution = (typeof IMAGE_RESOLUTIONS)[number];

export const IMAGE_ASPECT_RATIOS = ['1:1', '3:4', '4:3', 'custom'] as const;
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];

export const IMAGE_QUALITIES = ['low', 'medium', 'high'] as const;
export type ImageQuality = (typeof IMAGE_QUALITIES)[number];

export const MODERATION_STRICTNESS = ['low', 'medium', 'high', 'auto'] as const;
export type ModerationStrictness = (typeof MODERATION_STRICTNESS)[number];

export interface ImagePolicyKnown {
  providerHint?: ImageProviderHint;
  resolution?: ImageResolution;
  aspectRatio?: ImageAspectRatio;
  quality?: ImageQuality;
  moderationStrictness?: ModerationStrictness;
  negativePrompts?: string[];
  requiredTags?: string[];
  styleBias?: string;
}

export interface DomainBlueprint {
  required: string[];
  optional: string[];
  hint?: string;
}

export type DomainBlueprints = Partial<Record<AiProfileDomain, DomainBlueprint>>;

// ───────── Phase 6: batch + events + cleanup ─────────

export type BatchJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface BatchJobFailure {
  index: number;
  reason: string;
}

export interface BatchJob {
  id: string;
  templateId: string;
  templateVersion: number;
  status: BatchJobStatus;
  requestedCount: number;
  completedCount: number;
  failedCount: number;
  draftIds: string[];
  failures: BatchJobFailure[];
  createdByAdminUserId: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface BatchJobListQuery {
  status?: BatchJobStatus | 'all';
  page?: number;
  limit?: number;
}

export interface BatchJobListResponse {
  items: BatchJob[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBatchJobBody {
  templateId: string;
  count: number;
  seedHints?: string[];
  generateDomains?: AiProfileDomain[];
  autoGeneratePhotos?: boolean;
}

export interface EventBucket {
  date: string;
  count: number;
}

export interface EventSeries {
  event: string;
  buckets: EventBucket[];
}

export interface EventCountsResponse {
  days: number;
  series: EventSeries[];
}

export interface CleanupStatus {
  lastRunAt: string | null;
  lastArchivedCount: number;
  pendingCandidates: number;
  archiveAfterDays: number;
  batchLimit: number;
}

export interface CleanupRunResponse {
  archivedCount: number;
  skippedCount: number;
  runAt: string;
}
