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
  AiProfileTemplateListResponse,
  ApplyTemplateBody,
  CreateDraftBody,
  CreatePromptVersionBody,
  CreateTemplateBody,
  GenerateDomainBody,
  GeneratePhotoBody,
  PatchDomainBody,
  PatchDraftBody,
  PreviewChatBody,
  PreviewChatResponse,
  PromptVersion,
  PromptVersionListQuery,
  PromptVersionListResponse,
  PublishBody,
  PublishDryRunBody,
  PublishDryRunResponse,
  PublishResponse,
  RejectPhotoBody,
  RetryPhotoBody,
  SetRepresentativeImageBody,
  TemplateListQuery,
  TemplateListResponse,
  UpdatePromptVersionBody,
  UpdateTemplateBody,
  UploadPhotoBody,
} from '@/app/types/ai-profile-generator';

const BASE = '/admin/v2/ai-companions';

export const aiProfileGenerator = {
  listDrafts: (query: AiProfileDraftListQuery = {}) =>
    adminGet<AiProfileDraftListResponse>(`${BASE}/drafts`, { ...query }),

  getDraft: (id: string) => adminGet<AiProfileDraft>(`${BASE}/drafts/${id}`),

  createDraft: (body: CreateDraftBody) =>
    adminPost<AiProfileDraft>(`${BASE}/drafts`, body),

  patchDraft: (id: string, body: PatchDraftBody) =>
    adminPatch<AiProfileDraft>(`${BASE}/drafts/${id}`, body),

  deleteDraft: (id: string) => adminDelete<void>(`${BASE}/drafts/${id}`),

  generateDomain: (id: string, domain: AiProfileDomain, body: GenerateDomainBody) =>
    adminPost<AiProfileDraft>(
      `${BASE}/drafts/${id}/domains/${domain}/generate`,
      body,
    ),

  regenerateDomain: (id: string, domain: AiProfileDomain, body: GenerateDomainBody) =>
    adminPost<AiProfileDraft>(
      `${BASE}/drafts/${id}/domains/${domain}/regenerate`,
      body,
    ),

  patchDomain: (id: string, domain: AiProfileDomain, body: PatchDomainBody) =>
    adminPatch<AiProfileDraft>(`${BASE}/drafts/${id}/domains/${domain}`, body),

  listTemplates: () =>
    adminGet<AiProfileTemplateListResponse>(`${BASE}/templates`),

  applyTemplate: (id: string, body: ApplyTemplateBody) =>
    adminPost<AiProfileDraft>(`${BASE}/drafts/${id}/apply-template`, body),

  generatePhoto: (id: string, body: GeneratePhotoBody) =>
    adminPost<AiProfileDraft>(`${BASE}/drafts/${id}/photos/generate`, body),

  deletePhoto: (id: string, photoId: string) =>
    adminDelete<AiProfileDraft>(`${BASE}/drafts/${id}/photos/${photoId}`),

  uploadPhoto: (id: string, body: UploadPhotoBody) => {
    const fd = new FormData();
    fd.append('file', body.file);
    fd.append('expectedVersion', String(body.expectedVersion));
    if (body.setAsRepresentative) {
      fd.append('setAsRepresentative', 'true');
    }
    return adminUpload<AiProfileDraft>(
      `${BASE}/drafts/${id}/photos/upload`,
      fd,
    );
  },

  retryPhoto: (id: string, photoId: string, body: RetryPhotoBody) =>
    adminPost<AiProfileDraft>(
      `${BASE}/drafts/${id}/photos/${photoId}/retry`,
      body,
    ),

  rejectPhoto: (id: string, photoId: string, body: RejectPhotoBody) =>
    adminPost<AiProfileDraft>(
      `${BASE}/drafts/${id}/photos/${photoId}/reject`,
      body,
    ),

  setRepresentativeImage: (id: string, body: SetRepresentativeImageBody) =>
    adminPatch<AiProfileDraft>(
      `${BASE}/drafts/${id}/representative-image`,
      body,
    ),

  publishDryRun: (id: string, body: PublishDryRunBody) =>
    adminPost<PublishDryRunResponse>(`${BASE}/drafts/${id}/publish/dry-run`, body),

  publish: (id: string, body: PublishBody) =>
    adminPost<PublishResponse>(`${BASE}/drafts/${id}/publish`, body),

  previewChat: (id: string, body: PreviewChatBody) =>
    adminPost<PreviewChatResponse>(`${BASE}/drafts/${id}/preview-chat`, body),

  // Template CRUD
  listTemplatesPaged: (query: TemplateListQuery = {}) =>
    adminGet<TemplateListResponse>(`${BASE}/templates`, { ...query }),

  getTemplate: (id: string) =>
    adminGet<AiProfileTemplate>(`${BASE}/templates/${id}`),

  createTemplate: (body: CreateTemplateBody) =>
    adminPost<AiProfileTemplate>(`${BASE}/templates`, body),

  updateTemplate: (id: string, body: UpdateTemplateBody) =>
    adminPatch<AiProfileTemplate>(`${BASE}/templates/${id}`, body),

  archiveTemplate: (id: string) =>
    adminPost<AiProfileTemplate>(`${BASE}/templates/${id}/archive`),

  restoreTemplate: (id: string) =>
    adminPost<AiProfileTemplate>(`${BASE}/templates/${id}/restore`),

  duplicateTemplate: (id: string) =>
    adminPost<AiProfileTemplate>(`${BASE}/templates/${id}/duplicate`),

  // Prompt Version CRUD
  listPromptVersions: (query: PromptVersionListQuery = {}) =>
    adminGet<PromptVersionListResponse>(`${BASE}/prompt-versions`, { ...query }),

  getPromptVersion: (id: string) =>
    adminGet<PromptVersion>(`${BASE}/prompt-versions/${id}`),

  createPromptVersion: (body: CreatePromptVersionBody) =>
    adminPost<PromptVersion>(`${BASE}/prompt-versions`, body),

  updatePromptVersion: (id: string, body: UpdatePromptVersionBody) =>
    adminPatch<PromptVersion>(`${BASE}/prompt-versions/${id}`, body),

  activatePromptVersion: (id: string) =>
    adminPost<PromptVersion>(`${BASE}/prompt-versions/${id}/activate`),

  archivePromptVersion: (id: string) =>
    adminPost<PromptVersion>(`${BASE}/prompt-versions/${id}/archive`),
};

export type AiProfileGeneratorService = typeof aiProfileGenerator;
