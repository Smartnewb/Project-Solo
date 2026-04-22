'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type { AiProfileValidationWarning } from '@/app/types/ai-profile-generator';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Switch } from '@/shared/ui/switch';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
  version: number;
}

const SEVERITY_LABEL: Record<AiProfileValidationWarning['severity'], string> = {
  low: '낮음',
  medium: '중간',
  high: '높음',
};

const SEVERITY_CLASS: Record<AiProfileValidationWarning['severity'], string> = {
  low: 'text-slate-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
};

export function PublishDialog({
  open,
  onOpenChange,
  draftId,
  version,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.draftDetail(draftId),
  );
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) setAcknowledged(false);
  }, [open]);

  const dryRunQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.publishDryRun(draftId, version),
    queryFn: () =>
      aiProfileGenerator.publishDryRun(draftId, { expectedVersion: version }),
    enabled: open,
    staleTime: 0,
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.publish(draftId, {
        expectedVersion: version,
        acknowledgeWarnings: acknowledged,
      }),
    onSuccess: () => {
      toast.success('AI 컴패니언이 발행되었습니다.');
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.draftDetail(draftId),
      });
      queryClient.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.drafts(),
      });
      onOpenChange(false);
    },
    onError: handleError,
  });

  const blocked = dryRunQuery.data?.blocked ?? false;
  const warnings = dryRunQuery.data?.warnings ?? [];
  const blockedReasons = dryRunQuery.data?.blockedReasons ?? [];
  const hasHighWarnings = warnings.some((w) => w.severity === 'high');
  const publishDisabled =
    blocked ||
    publishMutation.isPending ||
    dryRunQuery.isLoading ||
    (hasHighWarnings && !acknowledged);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Draft 발행</DialogTitle>
          <DialogDescription>
            Dry-run 결과를 확인한 뒤 실제로 발행할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {dryRunQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-md bg-slate-100" />
          ) : null}

          {dryRunQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Dry-run에 실패했습니다.
                {dryRunQuery.error instanceof Error
                  ? ` (${dryRunQuery.error.message})`
                  : null}
              </AlertDescription>
            </Alert>
          ) : null}

          {dryRunQuery.data ? (
            <>
              {blockedReasons.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTitle>발행 차단 사유</AlertTitle>
                  <AlertDescription>
                    <ul className="ml-4 list-disc space-y-1">
                      {blockedReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {warnings.length > 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">
                    경고 ({warnings.length})
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {warnings.map((w, idx) => (
                      <li key={idx} className={SEVERITY_CLASS[w.severity]}>
                        [{SEVERITY_LABEL[w.severity]}] {w.domain} — {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600">
                  Companion 프리뷰
                </p>
                <pre className="max-h-64 overflow-auto rounded-md bg-slate-50 p-3 font-mono text-[11px]">
                  {JSON.stringify(dryRunQuery.data.companionPreview, null, 2)}
                </pre>
              </div>

              {hasHighWarnings ? (
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-700">
                    경고를 확인했습니다.
                  </div>
                  <Switch
                    checked={acknowledged}
                    onCheckedChange={setAcknowledged}
                    disabled={blocked || publishMutation.isPending}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={publishMutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={() => publishMutation.mutate()}
            disabled={publishDisabled}
          >
            {publishMutation.isPending ? '발행 중…' : '발행'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
