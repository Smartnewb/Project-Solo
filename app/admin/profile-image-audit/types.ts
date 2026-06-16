import type {
  ProfileImageAuditItem,
  ProfileImageAuditListParams,
} from '@/app/services/admin';

export type AuditAction = 'mark-ok' | 'second-review' | 'reject' | 'delete';

export type AuditFilters = Pick<
  ProfileImageAuditListParams,
  | 'auditStatus'
  | 'gender'
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
