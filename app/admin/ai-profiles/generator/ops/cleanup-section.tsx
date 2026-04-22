'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { formatDate } from '../_shared/format';
import { useAiProfileErrorHandler } from '../_shared-error';

export function CleanupSection() {
  const toast = useToast();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.cleanupStatus(),
  );

  const statusQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.cleanupStatus(),
    queryFn: () => aiProfileGenerator.getCleanupStatus(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 30_000;
      return data.pendingCandidates > 0 ? 30_000 : 5 * 60_000;
    },
  });

  const runMutation = useMutation({
    mutationFn: () => aiProfileGenerator.runCleanup(),
    onSuccess: (result) => {
      toast.success(
        `${result.archivedCount}건 아카이브, ${result.skippedCount}건 스킵되었습니다.`,
      );
      qc.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.cleanupStatus(),
      });
    },
    onError: handleError,
  });

  const status = statusQuery.data;

  const handleRun = async () => {
    if (!status) return;
    const ok = await confirm({
      title: 'Cleanup 실행',
      message: `아카이브 대상 ${status.pendingCandidates}건을 처리합니다. 계속하시겠습니까?`,
      confirmText: '실행',
      cancelText: '취소',
      severity: 'warning',
    });
    if (ok) runMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft Cleanup</CardTitle>
        <CardDescription>
          오래된 Draft를 아카이브하는 정리 job을 수동으로 실행합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription>상태를 불러오지 못했습니다.</AlertDescription>
          </Alert>
        ) : null}

        {statusQuery.isLoading ? (
          <p className="text-sm text-slate-500">불러오는 중…</p>
        ) : status ? (
          <>
            <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  마지막 실행
                </dt>
                <dd className="text-slate-800">{formatDate(status.lastRunAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  마지막 아카이브 수
                </dt>
                <dd className="text-slate-800">{status.lastArchivedCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">대기 후보</dt>
                <dd className="text-slate-800">{status.pendingCandidates}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  Archive After (일)
                </dt>
                <dd className="text-slate-800">{status.archiveAfterDays}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">
                  Batch Limit
                </dt>
                <dd className="text-slate-800">{status.batchLimit}</dd>
              </div>
            </dl>
            <div className="flex justify-end">
              <Button
                onClick={handleRun}
                disabled={
                  status.pendingCandidates <= 0 || runMutation.isPending
                }
              >
                {runMutation.isPending ? '실행 중…' : '지금 실행'}
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
