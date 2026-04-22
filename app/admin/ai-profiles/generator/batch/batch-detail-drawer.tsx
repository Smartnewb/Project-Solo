'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { formatDate } from '../_shared/format';
import { useAiProfileErrorHandler } from '../_shared-error';
import { BatchStatusBadge } from './batch-status-badge';

interface Props {
  batchJobId: string | null;
  onClose: () => void;
}

export function BatchDetailDrawer({ batchJobId, onClose }: Props) {
  const open = batchJobId !== null;
  const toast = useToast();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.batchJobs(),
  );

  const detailQuery = useQuery({
    queryKey: batchJobId
      ? aiProfileGeneratorKeys.batchJobDetail(batchJobId)
      : ['ai-profile-generator', 'batch-jobs', 'detail', 'none'],
    queryFn: () => aiProfileGenerator.getBatchJob(batchJobId as string),
    enabled: open,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job && (job.status === 'pending' || job.status === 'running')) {
        return 5000;
      }
      return false;
    },
  });

  const job = detailQuery.data;

  const cancelMutation = useMutation({
    mutationFn: (id: string) => aiProfileGenerator.cancelBatchJob(id),
    onSuccess: () => {
      toast.success('배치 job을 취소했습니다.');
      qc.invalidateQueries({ queryKey: aiProfileGeneratorKeys.batchJobs() });
    },
    onError: handleError,
  });

  const handleCancel = async () => {
    if (!job) return;
    const ok = await confirm({
      title: '배치 job 취소',
      message: `Job ${job.id}를 취소하시겠습니까? 진행 중인 Draft 생성은 중단됩니다.`,
      confirmText: '취소 실행',
      cancelText: '닫기',
      severity: 'warning',
    });
    if (ok) cancelMutation.mutate(job.id);
  };

  const canCancel =
    job !== undefined &&
    (job.status === 'pending' || job.status === 'running');

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>배치 job 상세</SheetTitle>
          <SheetDescription>
            Draft 생성 진행 상태와 결과를 확인합니다.
          </SheetDescription>
        </SheetHeader>

        {detailQuery.isLoading ? (
          <p className="py-6 text-sm text-slate-500">불러오는 중…</p>
        ) : detailQuery.isError ? (
          <p className="py-6 text-sm text-rose-600">
            배치 job을 불러오지 못했습니다.
          </p>
        ) : job ? (
          <div className="space-y-5 py-4 text-sm">
            <section className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-600">
                  {job.id}
                </span>
                <BatchStatusBadge status={job.status} />
              </div>
              <div className="text-xs text-slate-500">
                완료 {job.completedCount} / {job.requestedCount} · 실패{' '}
                {job.failedCount}
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">
                생성된 Draft
              </h4>
              {job.draftIds.length === 0 ? (
                <p className="text-xs text-slate-500">아직 없음</p>
              ) : (
                <ul className="space-y-1">
                  {job.draftIds.map((draftId) => (
                    <li key={draftId}>
                      <Link
                        href={`/admin/ai-profiles/generator/${draftId}`}
                        className="font-mono text-xs text-sky-700 underline hover:text-sky-900"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {draftId}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">
                실패 목록
              </h4>
              {job.failures.length === 0 ? (
                <p className="text-xs text-slate-500">없음</p>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-1 pr-2">#</th>
                      <th className="py-1">사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.failures.map((failure) => (
                      <tr
                        key={`${failure.index}-${failure.reason}`}
                        className="border-b border-slate-100 align-top"
                      >
                        <td className="py-1 pr-2 font-mono text-slate-600">
                          {failure.index}
                        </td>
                        <td className="py-1 text-rose-700">{failure.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <dt className="font-medium">템플릿</dt>
                <dd className="font-mono">
                  {job.templateId} (v{job.templateVersion})
                </dd>
              </div>
              <div>
                <dt className="font-medium">작성자</dt>
                <dd className="font-mono">{job.createdByAdminUserId}</dd>
              </div>
              <div>
                <dt className="font-medium">등록일</dt>
                <dd>{formatDate(job.createdAt)}</dd>
              </div>
              <div>
                <dt className="font-medium">시작일</dt>
                <dd>{formatDate(job.startedAt)}</dd>
              </div>
              <div>
                <dt className="font-medium">종료일</dt>
                <dd>{formatDate(job.finishedAt)}</dd>
              </div>
            </dl>

            {canCancel ? (
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? '취소 중…' : '배치 취소'}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
