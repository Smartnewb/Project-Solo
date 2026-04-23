'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { shortId } from '../_shared/format';
import { GeneratorTabs } from '../_tabs';
import { BatchEnqueueDialog } from './batch-enqueue-dialog';
import { BatchStatusBadge } from './batch-status-badge';

const LAST_JOB_KEY = 'ai-profile-generator:last-batch-job-id';
const POLL_INTERVAL_MS = 5_000;

export function BatchClient() {
  const [enqueueOpen, setEnqueueOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(LAST_JOB_KEY);
    if (stored) setJobId(stored);
  }, []);

  const rememberJob = (id: string) => {
    setJobId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_JOB_KEY, id);
    }
  };

  const statusQuery = useQuery({
    queryKey: jobId
      ? aiProfileGeneratorKeys.batchGenerationStatus(jobId)
      : aiProfileGeneratorKeys.batchGeneration(),
    queryFn: () =>
      jobId
        ? aiProfileGenerator.getBatchGenerationStatus(jobId)
        : Promise.resolve(null),
    enabled: Boolean(jobId),
    refetchInterval: (q) => {
      const state = q.state.data?.state;
      if (!state) return POLL_INTERVAL_MS;
      if (state === 'completed' || state === 'failed') return false;
      return POLL_INTERVAL_MS;
    },
  });

  const status = statusQuery.data ?? null;
  const created = status?.returnValue?.created ?? [];
  const failed = status?.returnValue?.failed ?? [];

  return (
    <section className="space-y-4 px-6 py-8">
      <GeneratorTabs />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">배치 생성</h1>
          <p className="mt-1 text-sm text-slate-500">
            자연어 지시문을 기반으로 여러 Draft를 한 번에 생성합니다. 최근 배치의
            상태를 이 페이지에서 확인합니다.
          </p>
        </div>
        <Button onClick={() => setEnqueueOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> 새 배치 enqueue
        </Button>
      </header>

      {jobId == null ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          최근 배치 이력이 없습니다. 상단의 "새 배치 enqueue" 버튼으로 시작하세요.
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">최근 Job</div>
              <div className="font-mono text-sm text-slate-800">
                {shortId(jobId)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status ? <BatchStatusBadge status={status.state} /> : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(LAST_JOB_KEY);
                  }
                  setJobId(null);
                }}
              >
                초기화
              </Button>
            </div>
          </div>

          {statusQuery.isError ? (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>
                배치 상태를 불러오지 못했습니다.
              </AlertDescription>
            </Alert>
          ) : null}

          {status ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>진행률</span>
                <div className="flex-1 overflow-hidden rounded bg-slate-100">
                  <div
                    className="h-2 bg-sky-500"
                    style={{ width: `${Math.min(100, Math.max(0, status.progress))}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-xs">
                  {status.progress}%
                </span>
              </div>

              {status.failedReason ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    실패 원인: {status.failedReason}
                  </AlertDescription>
                </Alert>
              ) : null}

              {created.length > 0 ? (
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-700">
                    생성된 Draft ({created.length})
                  </div>
                  <ul className="space-y-1 text-xs">
                    {created.map((c) => (
                      <li key={c.draftId}>
                        <Link
                          href={`/admin/ai-profiles/generator/${c.draftId}`}
                          className="text-sky-700 hover:underline"
                        >
                          {shortId(c.draftId)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {failed.length > 0 ? (
                <div>
                  <div className="mb-2 text-xs font-semibold text-rose-700">
                    실패 ({failed.length})
                  </div>
                  <ul className="space-y-1 text-xs text-rose-700">
                    {failed.map((f) => (
                      <li key={f.index}>
                        #{f.index + 1} — {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-500">상태 조회 중…</div>
          )}
        </div>
      )}

      <BatchEnqueueDialog
        open={enqueueOpen}
        onOpenChange={setEnqueueOpen}
        onEnqueued={(id) => rememberJob(id)}
      />
    </section>
  );
}
