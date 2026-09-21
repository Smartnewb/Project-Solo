import type {
  AiProfileDraftStatus,
  BatchJobState,
  PromptVersionStatus,
} from '@/app/types/ai-profile-generator';

export const DRAFT_STATUS_LABEL: Record<AiProfileDraftStatus, string> = {
  draft: '초안',
  generating: '생성 중',
  publishing: '발행 중',
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
  publishing: 'default',
  failed: 'destructive',
  published: 'default',
  archived: 'outline',
};

export const DRAFT_STATUS_VALUES: AiProfileDraftStatus[] = [
  'draft',
  'generating',
  'publishing',
  'failed',
  'published',
  'archived',
];

export function isReadonlyStatus(status: AiProfileDraftStatus): boolean {
  return (
    status === 'published' ||
    status === 'archived' ||
    status === 'publishing'
  );
}

export const BATCH_STATE_LABEL: Record<BatchJobState, string> = {
  waiting: '대기',
  active: '실행 중',
  completed: '완료',
  failed: '실패',
  delayed: '지연',
  paused: '일시정지',
  unknown: '알 수 없음',
};

export const BATCH_STATE_VALUES: BatchJobState[] = [
  'waiting',
  'active',
  'completed',
  'failed',
  'delayed',
  'paused',
  'unknown',
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
