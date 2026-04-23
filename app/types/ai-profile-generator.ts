export type AiProfileDraftScope = 'admin_curated' | 'user_custom';
export type AiProfileDraftStatus =
  | 'draft'
  | 'generating'
  | 'publishing'
  | 'published'
  | 'archived'
  | 'failed';

export type AiProfileContentTier = 'family' | 'sensual' | 'explicit';

export const CONTENT_TIERS: AiProfileContentTier[] = [
  'family',
  'sensual',
  'explicit',
];

export const CONTENT_TIER_LABEL: Record<AiProfileContentTier, string> = {
  family: '가족 친화',
  sensual: '성숙',
  explicit: '선정적',
};

export type AiProfileRelationshipStage =
  | 'stranger'
  | 'acquaintance'
  | 'crush'
  | 'dating'
  | 'committed';

export const RELATIONSHIP_STAGES: AiProfileRelationshipStage[] = [
  'stranger',
  'acquaintance',
  'crush',
  'dating',
  'committed',
];

export const RELATIONSHIP_STAGE_LABEL: Record<
  AiProfileRelationshipStage,
  string
> = {
  stranger: '낯선 사이',
  acquaintance: '지인',
  crush: '호감',
  dating: '연인',
  committed: '안정 커플',
};

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
  | 'photoPrompt'
  | 'photo';

export const GENERATABLE_DOMAINS: AiProfileDomain[] = [
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

export const ALL_DOMAINS: AiProfileDomain[] = [
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
  'photo',
];

// Backward-compat aliases (kept for existing imports until cleaned up)
export const MVP_DOMAINS: AiProfileDomain[] = ALL_DOMAINS;
export const FULL_DOMAINS: AiProfileDomain[] = ALL_DOMAINS;

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
  photo: 'photo',
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
  photo: '사진',
};

export type AiProfileDomainStatus =
  | 'empty'
  | 'generating'
  | 'ready'
  | 'stale'
  | 'blocked'
  | 'failed';

export interface AiProfileValidationWarning {
  domain: AiProfileDomain | 'draft' | 'global';
  path?: string;
  severity?: 'low' | 'medium' | 'high';
  code?: string;
  message: string;
}

export interface AiProfileValidationState {
  warnings: AiProfileValidationWarning[];
  blockedFlags: string[];
  lastValidatedAt: string | null;
}

export interface AiProfileGalleryItem {
  url: string;
  prompt?: string;
  tags?: string[];
}

export interface AiProfilePromptVersionSnapshot {
  id: string;
  version: number;
  name: string;
  capturedAt: string;
}

export interface AiProfileDraft {
  id: string;
  scope: AiProfileDraftScope;
  status: AiProfileDraftStatus;
  adminUserId: string | null;
  ownerUserId: string | null;
  templateId: string | null;
  templateVersion: number | null;
  promptVersionId: string | null;
  promptVersionSnapshot: AiProfilePromptVersionSnapshot | null;
  domains: Partial<Record<AiProfileDomain, unknown>>;
  domainStatus: Record<AiProfileDomain, AiProfileDomainStatus>;
  validation: AiProfileValidationState;
  generationCost: Record<string, unknown>;
  controlPolicy: Record<string, unknown>;
  lockedFields: Record<string, unknown>;
  sourceDataSnapshot: Record<string, unknown>;
  publishedCompanionId: string | null;
  representativeImageUrl: string | null;
  gallery: AiProfileGalleryItem[];
  version: number;
  createdAt: string;
  updatedAt: string | null;
}

// ───────── Draft list (page-based) ─────────

export interface AiProfileDraftListQuery {
  page?: number;
  limit?: number;
  status?: AiProfileDraftStatus;
  scope?: AiProfileDraftScope;
  q?: string;
  templateId?: string;
  adminUserId?: string;
  ownerUserId?: string;
  hasImage?: boolean;
  publishedCompanionId?: string;
  domain?: AiProfileDomain;
  domainStatus?: AiProfileDomainStatus;
}

export interface AiProfileDraftListResponse {
  items: AiProfileDraft[];
  totalCount: number;
  page: number;
  limit: number;
}

// ───────── Draft mutations ─────────

export interface CreateDraftBody {
  scope?: AiProfileDraftScope;
  initialInstruction: string;
  contentTier?: AiProfileContentTier;
  templateId?: string;
  promptVersionId?: string;
  templateOverrides?: {
    instruction?: string;
    randomizationPolicy?: Record<string, unknown>;
  };
  lockedSourceData?: {
    universityId?: string;
    departmentId?: string;
  };
}

export interface ArchiveDraftBody {
  expectedVersion: number;
  reason?: string;
}

export interface DuplicateDraftBody {
  expectedVersion: number;
  copyMedia?: boolean;
}

export interface ValidateDraftBody {
  expectedVersion: number;
}

export interface ValidateDraftResponse {
  draft: AiProfileDraft;
  summary: {
    warningCount: number;
    blockedFlagCount: number;
    canPublish: boolean;
  };
}

export interface LockSourceDataBody {
  expectedVersion: number;
  universityId: string;
  departmentId: string;
}

export interface ClearSourceDataLockBody {
  expectedVersion: number;
}

export interface UpdateMediaBody {
  expectedVersion: number;
  representativeImageUrl?: string | null;
  gallery?: AiProfileGalleryItem[];
}

export type PhotoSlot =
  | 'representative'
  | 'gallery_1'
  | 'gallery_2'
  | 'gallery_3'
  | 'gallery_4'
  | 'gallery_5'
  | 'gallery_6'
  | 'gallery_7'
  | 'gallery_8';

export const PHOTO_SLOTS: PhotoSlot[] = [
  'representative',
  'gallery_1',
  'gallery_2',
  'gallery_3',
  'gallery_4',
  'gallery_5',
  'gallery_6',
  'gallery_7',
  'gallery_8',
];

export const PHOTO_SLOT_LABEL: Record<PhotoSlot, string> = {
  representative: '대표',
  gallery_1: '갤러리 1',
  gallery_2: '갤러리 2',
  gallery_3: '갤러리 3',
  gallery_4: '갤러리 4',
  gallery_5: '갤러리 5',
  gallery_6: '갤러리 6',
  gallery_7: '갤러리 7',
  gallery_8: '갤러리 8',
};

export interface UploadMediaBody {
  file: File;
  expectedVersion: number;
  slot?: PhotoSlot;
  prompt?: string;
  tags?: string;
}

export interface GenerateDomainBody {
  expectedVersion: number;
  instruction?: string;
  promptVersionId?: string;
  mode?: 'generate' | 'regenerate';
  controlPolicy?: {
    preserveLockedFields?: boolean;
    preservePaths?: string[];
    randomizePaths?: string[];
  };
}

export interface PatchDomainFieldBody {
  expectedVersion: number;
  path: string;
  value: unknown;
  reason: string;
}

export interface RegenerateDomainFieldBody {
  expectedVersion: number;
  path: string;
  instruction: string;
  promptVersionId?: string;
}

export interface ApplyDomainInstructionBody {
  expectedVersion: number;
  instruction: string;
  promptVersionId?: string;
}

export interface GeneratePhotoBody {
  expectedVersion: number;
  slots?: PhotoSlot[];
  instruction?: string;
  promptVersionId?: string;
}

export interface PublishDryRunResponse {
  draftId: string;
  payload: Record<string, unknown>;
  warnings: AiProfileValidationWarning[];
  canPublish: boolean;
}

export interface PublishBody {
  expectedVersion: number;
  isPublic?: boolean;
  unlockPriceGems?: number;
  confirmStaleWarnings?: boolean;
}

export interface PublishResponse {
  companionId: string;
  draft: AiProfileDraft;
}

export interface PreviewChatBody {
  userMessage: string;
  relationshipStage?: AiProfileRelationshipStage;
  contentTier?: AiProfileContentTier;
}

export interface PreviewChatTurnsBody {
  userMessages: string[];
  relationshipStage?: AiProfileRelationshipStage;
  contentTier?: AiProfileContentTier;
}

export interface PreviewChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface PreviewChatResponse {
  turns: PreviewChatTurn[];
  tokensUsed?: number;
}

// ───────── Source data ─────────

export interface SourceUniversity {
  id: string;
  name: string;
  region?: string | null;
}

export interface SourceDepartment {
  id: string;
  name: string;
  universityId: string;
}

export interface SourceDataQuery {
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface CursorListResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface SuggestSchoolMajorBody {
  instruction: string;
  excludeUniversityIds?: string[];
  excludeDepartmentIds?: string[];
}

export interface SuggestSchoolMajorResult {
  universityId: string;
  universityName: string;
  departmentId: string;
  departmentName: string;
  reason?: string;
}

export interface SuggestSchoolMajorResponse {
  suggestions: SuggestSchoolMajorResult[];
}

// ───────── Generation templates ─────────

export interface AiProfileTemplate {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: 'active' | 'archived';
  createdByAdminUserId: string | null;
  promptVersionId: string | null;
  baseInstruction: string;
  domainInstructions: Record<string, string> | null;
  lockedFields: Record<string, unknown> | null;
  randomizationPolicy: Record<string, unknown> | null;
  sourceDataPolicy: Record<string, unknown> | null;
  imagePolicy: Record<string, unknown> | null;
  safetyPolicy: Record<string, unknown> | null;
  domainBlueprints: Record<string, unknown> | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface TemplateListQuery {
  q?: string;
  limit?: number;
  cursor?: string;
  isActive?: boolean;
}

export type TemplateListResponse = CursorListResponse<AiProfileTemplate>;

export interface CreateTemplateBody {
  name: string;
  description?: string;
  promptVersionId?: string;
  baseInstruction: string;
  domainInstructions?: Record<string, string>;
  lockedFields?: Record<string, unknown>;
  randomizationPolicy?: Record<string, unknown>;
  sourceDataPolicy?: Record<string, unknown>;
  imagePolicy?: Record<string, unknown>;
  safetyPolicy?: Record<string, unknown>;
  domainBlueprints?: Record<string, unknown>;
  isActive?: boolean;
}

export type UpdateTemplateBody = Partial<CreateTemplateBody>;

export interface SaveDraftAsTemplateBody {
  name: string;
  description?: string;
  includeDomains?: AiProfileDomain[];
  excludeFields?: string[];
  defaultRandomizationPolicy?: Record<string, unknown>;
}

export interface SaveCompanionAsTemplateBody {
  name: string;
  description?: string;
  baseInstruction?: string;
  promptVersionId?: string;
  includeMedia?: boolean;
  defaultRandomizationPolicy?: Record<string, unknown>;
}

// ───────── Prompt versions ─────────

export type PromptVersionStatus = 'draft' | 'active' | 'archived';

export interface PromptVersion {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: PromptVersionStatus;
  isDefault: boolean;
  createdByAdminUserId: string | null;
  globalInstruction: string | null;
  domainInstructions: Record<string, string> | null;
  safetyInstruction: string | null;
  repairInstruction: string | null;
  temperatureByDomain: Record<string, number> | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PromptVersionListQuery {
  q?: string;
  limit?: number;
  cursor?: string;
  isActive?: boolean;
}

export type PromptVersionListResponse = CursorListResponse<PromptVersion>;

export interface CreatePromptVersionBody {
  name: string;
  description?: string;
  globalInstruction?: string;
  domainInstructions?: Record<string, string>;
  safetyInstruction?: string;
  repairInstruction?: string;
  temperatureByDomain?: Record<string, number>;
  isDefault?: boolean;
}

export interface UpdatePromptVersionBody {
  name?: string;
  description?: string;
  globalInstruction?: string;
  domainInstructions?: Record<string, string>;
  safetyInstruction?: string;
  repairInstruction?: string;
  temperatureByDomain?: Record<string, number>;
  isActive?: boolean;
}

// ───────── Batch ─────────

export type BatchJobState =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused'
  | 'unknown';

export interface BatchGenerateBody {
  count: number;
  initialInstruction: string;
  contentTier?: AiProfileContentTier;
  templateId?: string;
  promptVersionId?: string;
  generateDomains?: AiProfileDomain[];
  includePhotos?: boolean;
  photoSlots?: PhotoSlot[];
}

export interface BatchGenerateEnqueueResponse {
  jobId: string;
  status: 'queued';
}

export interface BatchGenerateStatusResponse {
  jobId: string;
  state: BatchJobState;
  progress: number;
  returnValue?: {
    createdDraftIds: string[];
    failures: { index: number; reason: string }[];
  };
  failedReason?: string;
}

// ───────── Structured policy types (kept from prior phases) ─────────

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
