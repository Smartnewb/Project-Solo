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
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { useAiProfileErrorHandler } from '../_shared-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId: string;
  version: number;
}

const SEVERITY_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: '낮음',
  medium: '중간',
  high: '높음',
};

const SEVERITY_CLASS: Record<'low' | 'medium' | 'high', string> = {
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
  const [isPublic, setIsPublic] = useState(true);
  const [unlockPriceGems, setUnlockPriceGems] = useState(3);
  const [confirmStaleWarnings, setConfirmStaleWarnings] = useState(false);

  useEffect(() => {
    if (open) {
      setIsPublic(true);
      setUnlockPriceGems(3);
      setConfirmStaleWarnings(false);
    }
  }, [open]);

  const dryRunQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.publishDryRun(draftId, version),
    queryFn: () => aiProfileGenerator.publishDryRun(draftId),
    enabled: open,
    staleTime: 60_000,
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      aiProfileGenerator.publish(draftId, {
        expectedVersion: version,
        isPublic,
        unlockPriceGems,
        confirmStaleWarnings,
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

  const canPublish = dryRunQuery.data?.canPublish ?? false;
  const warnings = (dryRunQuery.data?.warnings ??
    []) as AiProfileValidationWarning[];
  const staleCount = warnings.filter(
    (w) => typeof w.code === 'string' && w.code.toLowerCase().includes('stale'),
  ).length;
  const hasHighWarnings = warnings.some(
    (w) => w.severity === 'high',
  );
  const publishDisabled =
    !canPublish ||
    publishMutation.isPending ||
    dryRunQuery.isLoading ||
    (staleCount > 0 && !confirmStaleWarnings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Draft 발행</DialogTitle>
          <DialogDescription>
            Dry-run 결과를 확인한 뒤 공개 범위와 금액을 설정해 발행합니다.
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
              {!canPublish ? (
                <Alert variant="destructive">
                  <AlertTitle>발행이 차단되었습니다</AlertTitle>
                  <AlertDescription>
                    아래 경고를 해결한 뒤 다시 시도하세요.
                  </AlertDescription>
                </Alert>
              ) : null}

              {warnings.length > 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">
                    경고 ({warnings.length})
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {warnings.map((w, idx) => {
                      const sev = (w.severity ?? 'low') as
                        | 'low'
                        | 'medium'
                        | 'high';
                      return (
                        <li key={idx} className={SEVERITY_CLASS[sev]}>
                          [{SEVERITY_LABEL[sev]}] {String(w.domain)}
                          {w.path ? ` · ${w.path}` : ''} — {w.message}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <div>
                <p className="mb-1 text-xs font-semibold text-slate-600">
                  Companion 페이로드
                </p>
                <pre className="max-h-64 overflow-auto rounded-md bg-slate-50 p-3 font-mono text-[11px]">
                  {JSON.stringify(dryRunQuery.data.payload, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3">
                  <Label htmlFor="publish-is-public">공개</Label>
                  <Switch
                    id="publish-is-public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    disabled={publishMutation.isPending}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="publish-price">잠금 해제 젬</Label>
                  <Input
                    id="publish-price"
                    type="number"
                    min={0}
                    max={999}
                    value={unlockPriceGems}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) setUnlockPriceGems(n);
                    }}
                    disabled={publishMutation.isPending}
                  />
                </div>
              </div>

              {staleCount > 0 || hasHighWarnings ? (
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-700">
                    Stale 경고 {staleCount}건을 확인했습니다.
                  </div>
                  <Switch
                    checked={confirmStaleWarnings}
                    onCheckedChange={setConfirmStaleWarnings}
                    disabled={publishMutation.isPending}
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
