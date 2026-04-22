import type {
  AiProfileDraftStatus,
  BatchJobStatus,
  PromptVersionStatus,
} from '@/app/types/ai-profile-generator';

export const DRAFT_STATUS_LABEL: Record<AiProfileDraftStatus, string> = {
  draft: '초안',
  generating: '생성 중',
  failed: '실패',
  published: '배포됨',
  archived: '아카이브',
};

export const DRAFT_STATUS_VARIANT: Record<
  AiProfileDraftStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  draft: 'secondary',
  generating: 'default',
  failed: 'destructive',
  published: 'default',
  archived: 'outline',
};

export const DRAFT_STATUS_VALUES: AiProfileDraftStatus[] = [
  'draft',
  'generating',
  'failed',
  'published',
  'archived',
];

export const BATCH_STATUS_LABEL: Record<BatchJobStatus, string> = {
  pending: '대기',
  running: '실행 중',
  completed: '완료',
  cancelled: '취소됨',
  failed: '실패',
};

export const BATCH_STATUS_VALUES: BatchJobStatus[] = [
  'pending',
  'running',
  'completed',
  'cancelled',
  'failed',
];

export const PROMPT_VERSION_STATUS_LABEL: Record<PromptVersionStatus, string> = {
  draft: '초안',
  active: '활성',
  archived: '아카이브',
};

export const PROMPT_VERSION_STATUS_VALUES: PromptVersionStatus[] = [
  'draft',
  'active',
  'archived',
];

export const PROMPT_VERSION_STATUS_VARIANT: Record<
  PromptVersionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  draft: 'secondary',
  active: 'default',
  archived: 'outline',
};
