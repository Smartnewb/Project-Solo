import type {
  ProfileImageAuditItem,
  ProfileImageAuditListParams,
} from '@/app/services/admin';

export type AuditAction = 'mark-ok' | 'second-review' | 'reject' | 'delete';

export type AuditFilters = Pick<
  ProfileImageAuditListParams,
  | 'search'
  | 'includeAlreadyAudited'
  | 'auditStatus'
  | 'gender'
  | 'profileRank'
  | 'isMain'
  | 'hasReport'
  | 'validationDecision'
  | 'includeSuspended'
  | 'includeBlacklisted'
>;

export type SelectedAuditGroup = {
  readonly selectedItems: readonly ProfileImageAuditItem[];
  readonly selectedIds: readonly string[];
  readonly selectedUserIds: readonly string[];
};
