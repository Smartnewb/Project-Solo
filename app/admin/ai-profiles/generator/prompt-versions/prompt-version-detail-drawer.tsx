'use client';

import { useQuery } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type { PromptVersionStatus } from '@/app/types/ai-profile-generator';
import { Badge } from '@/shared/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';

interface Props {
  promptVersionId: string | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<PromptVersionStatus, string> = {
  draft: '초안',
  active: '활성',
  archived: '아카이브',
};

const STATUS_VARIANT: Record<
  PromptVersionStatus,
  'default' | 'secondary' | 'outline'
> = {
  draft: 'secondary',
  active: 'default',
  archived: 'outline',
};

function formatDate(value: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('ko-KR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

export function PromptVersionDetailDrawer({
  promptVersionId,
  onClose,
}: Props) {
  const open = promptVersionId !== null;

  const detailQuery = useQuery({
    queryKey: promptVersionId
      ? aiProfileGeneratorKeys.promptVersionDetail(promptVersionId)
      : ['ai-profile-generator', 'prompt-versions', 'detail', 'none'],
    queryFn: () => aiProfileGenerator.getPromptVersion(promptVersionId as string),
    enabled: open,
  });

  const pv = detailQuery.data;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>프롬프트 버전 상세</SheetTitle>
          <SheetDescription>
            선택한 프롬프트 버전의 스냅샷을 확인합니다.
          </SheetDescription>
        </SheetHeader>

        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-slate-500">불러오는 중…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-rose-600">
            프롬프트 버전을 불러오지 못했습니다.
          </p>
        ) : pv ? (
          <div className="space-y-4 py-4 text-sm">
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {pv.name}
                </h3>
                <Badge variant={STATUS_VARIANT[pv.status]}>
                  {STATUS_LABEL[pv.status]}
                </Badge>
                <span className="font-mono text-xs text-slate-500">
                  v{pv.version}
                </span>
              </div>
              {pv.description ? (
                <p className="whitespace-pre-wrap text-slate-600">
                  {pv.description}
                </p>
              ) : null}
            </section>

            <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <dt className="font-medium">작성자</dt>
                <dd className="font-mono">{pv.createdByAdminUserId}</dd>
              </div>
              <div>
                <dt className="font-medium">생성일</dt>
                <dd>{formatDate(pv.createdAt)}</dd>
              </div>
              <div>
                <dt className="font-medium">수정일</dt>
                <dd>{formatDate(pv.updatedAt)}</dd>
              </div>
              <div>
                <dt className="font-medium">활성화일</dt>
                <dd>{formatDate(pv.activatedAt)}</dd>
              </div>
            </dl>

            <section>
              <h4 className="mb-1 text-sm font-semibold text-slate-700">
                config 스냅샷
              </h4>
              <pre className="max-h-[40vh] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800">
                {JSON.stringify(pv.config, null, 2)}
              </pre>
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
