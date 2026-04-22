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
  | 'personalityCore'
  | 'relationshipPsychology'
  | 'voice'
  | 'chatBehavior';

export const MVP_DOMAINS: AiProfileDomain[] = [
  'seed',
  'basic',
  'personalityCore',
  'relationshipPsychology',
  'voice',
  'chatBehavior',
];

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
  gallery: string[];
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
