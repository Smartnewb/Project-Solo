import {
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
  adminUpload,
} from '@/shared/lib/http/admin-fetch';
import type {
  AiProfileDomain,
  AiProfileDraft,
  AiProfileDraftListQuery,
  AiProfileDraftListResponse,
  AiProfileTemplate,
  ApplyDomainInstructionBody,
  ArchiveDraftBody,
  BatchGenerateBody,
  BatchGenerateEnqueueResponse,
  BatchGenerateStatusResponse,
  ClearSourceDataLockBody,
  CreateDraftBody,
  CreatePromptVersionBody,
  CreateTemplateBody,
  DuplicateDraftBody,
  GenerateDomainBody,
  GeneratePhotoBody,
  LockSourceDataBody,
  PatchDomainFieldBody,
  PreviewChatBody,
  PreviewChatResponse,
  PreviewChatTurnsBody,
  PromptVersion,
  PromptVersionListQuery,
  PromptVersionListResponse,
  PublishBody,
  PublishDryRunResponse,
  PublishResponse,
  RegenerateDomainFieldBody,
  SaveCompanionAsTemplateBody,
  SaveDraftAsTemplateBody,
  SourceDataQuery,
  SourceDepartment,
  SourceUniversity,
  SuggestSchoolMajorBody,
  SuggestSchoolMajorResponse,
  TemplateListQuery,
  TemplateListResponse,
  UpdateMediaBody,
  UpdatePromptVersionBody,
  UpdateTemplateBody,
  UploadMediaBody,
  ValidateDraftBody,
  ValidateDraftResponse,
  CursorListResponse,
} from '@/app/types/ai-profile-generator';

const BASE = '/admin/v2/ai-companions';

export const aiProfileGenerator = {
  // ───────── Source data ─────────
  listUniversities: (query: SourceDataQuery = {}) =>
    adminGet<CursorListResponse<SourceUniversity>>(
      `${BASE}/source-data/universities`,
      { ...query },
    ),

  listDepartments: (universityId: string, query: SourceDataQuery = {}) =>
    adminGet<CursorListResponse<SourceDepartment>>(
      `${BASE}/source-data/universities/${universityId}/departments`,
      { ...query },
    ),

  suggestSchoolMajor: (body: SuggestSchoolMajorBody) =>
    adminPost<SuggestSchoolMajorResponse>(
      `${BASE}/source-data/suggest-school-major`,
      body,
    ),

  // ───────── Drafts ─────────
  listDrafts: (query: AiProfileDraftListQuery = {}) =>
    adminGet<AiProfileDraftListResponse>(`${BASE}/drafts`, { ...query }),

  getDraft: (id: string) => adminGet<AiProfileDraft>(`${BASE}/drafts/${id}`),

  createDraft: (body: CreateDraftBody) =>
    adminPost<AiProfileDraft>(`${BASE}/drafts`, body),

  archiveDraft: (id: string, body: ArchiveDraftBody) =>
    adminPost<AiProfileDraft>(`${BASE}/drafts/${id}/archive`, body),

  duplicateDraft: (id: string, body: DuplicateDraftBody) =>
    adminPost<AiProfileDraft>(`${BASE}/drafts/${id}/duplicate`, body),

  validateDraft: (id: string, body: ValidateDraftBody) =>
    adminPost<ValidateDraftResponse>(`${BASE}/drafts/${id}/validate`, body),

  lockSourceData: (id: string, body: LockSourceDataBody) =>
    adminPost<AiProfileDraft>(`${BASE}/drafts/${id}/source-data/lock`, body),

  clearSourceDataLock: (id: string, body: ClearSourceDataLockBody) =>
    adminPost<AiProfileDraft>(
      `${BASE}/drafts/${id}/source-data/clear-lock`,
      body,
    ),

  updateMedia: (id: string, body: UpdateMediaBody) =>
    adminPatch<AiProfileDraft>(`${BASE}/drafts/${id}/media`, body),

  uploadMedia: (id: string, body: UploadMediaBody) => {
    const fd = new FormData();
    fd.append('image', body.file);
    fd.append('expectedVersion', String(body.expectedVersion));
    if (body.slot) {
      fd.append('slot', body.slot);
    }
    if (body.prompt) {
      fd.append('prompt', body.prompt);
    }
    if (body.tags) {
      fd.append('tags', body.tags);
    }
    return adminUpload<AiProfileDraft>(
      `${BASE}/drafts/${id}/media/upload`,
      fd,
    );
  },

  // ───────── Domain operations ─────────
  generateDomain: (
    id: string,
    domain: AiProfileDomain,
    body: GenerateDomainBody,
  ) =>
    adminPost<AiProfileDraft>(
      `${BASE}/drafts/${id}/domains/${domain}/generate`,
      body,
    ),

  patchDomainField: (
    id: string,
    domain: AiProfileDomain,
    body: PatchDomainFieldBody,
  ) =>
    adminPatch<AiProfileDraft>(
      `${BASE}/drafts/${id}/domains/${domain}/fields`,
      body,
    ),

  regenerateDomainField: (
    id: string,
    domain: AiProfileDomain,
    body: RegenerateDomainFieldBody,
  ) =>
    adminPost<AiProfileDraft>(
      `${BASE}/drafts/${id}/domains/${domain}/fields/regenerate`,
      body,
    ),

  applyDomainInstruction: (
    id: string,
    domain: AiProfileDomain,
    body: ApplyDomainInstructionBody,
  ) =>
    adminPost<AiProfileDraft>(
      `${BASE}/drafts/${id}/domains/${domain}/apply-instruction`,
      body,
    ),

  // ───────── Publish ─────────
  publishDryRun: (id: string) =>
    adminPost<PublishDryRunResponse>(`${BASE}/drafts/${id}/publish/dry-run`),

  publish: (id: string, body: PublishBody) =>
    adminPost<PublishResponse>(`${BASE}/drafts/${id}/publish`, body),

  // ───────── Photos ─────────
  generatePhoto: (id: string, body: GeneratePhotoBody) =>
    adminPost<AiProfileDraft>(`${BASE}/drafts/${id}/photos/generate`, body),

  // ───────── Preview chat ─────────
  previewChat: (id: string, body: PreviewChatBody) =>
    adminPost<PreviewChatResponse>(`${BASE}/drafts/${id}/preview-chat`, body),

  previewChatTurns: (id: string, body: PreviewChatTurnsBody) =>
    adminPost<PreviewChatResponse>(
      `${BASE}/drafts/${id}/preview-chat/turns`,
      body,
    ),

  // ───────── Batch ─────────
  batchGenerateDrafts: (body: BatchGenerateBody) =>
    adminPost<BatchGenerateEnqueueResponse>(
      `${BASE}/drafts/batch-generate`,
      body,
    ),

  getBatchGenerationStatus: (jobId: string) =>
    adminGet<BatchGenerateStatusResponse>(
      `${BASE}/drafts/batch-generate/${jobId}`,
    ),

  // ───────── Save as template ─────────
  saveDraftAsTemplate: (id: string, body: SaveDraftAsTemplateBody) =>
    adminPost<AiProfileTemplate>(
      `${BASE}/drafts/${id}/save-as-template`,
      body,
    ),

  saveCompanionAsTemplate: (
    companionId: string,
    body: SaveCompanionAsTemplateBody,
  ) =>
    adminPost<AiProfileTemplate>(
      `${BASE}/companions/${companionId}/save-as-template`,
      body,
    ),

  // ───────── Prompt Versions ─────────
  listPromptVersions: (query: PromptVersionListQuery = {}) =>
    adminGet<PromptVersionListResponse>(`${BASE}/prompt-versions`, {
      ...query,
    }),

  getPromptVersion: (id: string) =>
    adminGet<PromptVersion>(`${BASE}/prompt-versions/${id}`),

  createPromptVersion: (body: CreatePromptVersionBody) =>
    adminPost<PromptVersion>(`${BASE}/prompt-versions`, body),

  updatePromptVersion: (id: string, body: UpdatePromptVersionBody) =>
    adminPatch<PromptVersion>(`${BASE}/prompt-versions/${id}`, body),

  archivePromptVersion: (id: string) =>
    adminDelete<void>(`${BASE}/prompt-versions/${id}`),

  setDefaultPromptVersion: (id: string) =>
    adminPost<PromptVersion>(`${BASE}/prompt-versions/${id}/default`),

  // ───────── Generation Templates ─────────
  listGenerationTemplates: (query: TemplateListQuery = {}) =>
    adminGet<TemplateListResponse>(`${BASE}/generation-templates`, {
      ...query,
    }),

  getGenerationTemplate: (id: string) =>
    adminGet<AiProfileTemplate>(`${BASE}/generation-templates/${id}`),

  createGenerationTemplate: (body: CreateTemplateBody) =>
    adminPost<AiProfileTemplate>(`${BASE}/generation-templates`, body),

  updateGenerationTemplate: (id: string, body: UpdateTemplateBody) =>
    adminPatch<AiProfileTemplate>(`${BASE}/generation-templates/${id}`, body),

  archiveGenerationTemplate: (id: string) =>
    adminDelete<void>(`${BASE}/generation-templates/${id}`),
};

export type AiProfileGeneratorService = typeof aiProfileGenerator;
