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
  PatchDomainBody,
  PatchDraftBody,
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
};

export type AiProfileGeneratorService = typeof aiProfileGenerator;
