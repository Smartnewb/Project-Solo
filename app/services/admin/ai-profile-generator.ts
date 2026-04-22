import {
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
} from '@/shared/lib/http/admin-fetch';
import type {
  AiProfileDomain,
  AiProfileDraft,
  AiProfileDraftListQuery,
  AiProfileDraftListResponse,
  AiProfileTemplateListResponse,
  ApplyTemplateBody,
  CreateDraftBody,
  GenerateDomainBody,
  GeneratePhotoBody,
  PatchDomainBody,
  PatchDraftBody,
  PreviewChatBody,
  PreviewChatResponse,
  PublishBody,
  PublishDryRunBody,
  PublishDryRunResponse,
  PublishResponse,
  SetRepresentativeImageBody,
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
};

export type AiProfileGeneratorService = typeof aiProfileGenerator;
