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
  createdAt: string;
  updatedAt: string | null;
}

export interface AiProfileTemplateListResponse {
  items: AiProfileTemplate[];
  total: number;
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
