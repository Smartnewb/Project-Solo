'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type {
  BatchJob,
  BatchJobListQuery,
  BatchJobStatus,
} from '@/app/types/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { formatDate, shortId } from '../_shared/format';
import { PaginationFooter } from '../_shared/pagination-footer';
import {
  BATCH_STATUS_LABEL,
  BATCH_STATUS_VALUES,
} from '../_shared/status';
import { useQuerySyncedState } from '../_shared/use-query-synced-state';
import { GeneratorTabs } from '../_tabs';
import { BatchDetailDrawer } from './batch-detail-drawer';
import { BatchEnqueueDialog } from './batch-enqueue-dialog';
import { BatchStatusBadge } from './batch-status-badge';

const DEFAULT_LIMIT = 20;
const POLL_INTERVAL_MS = 10_000;

type StatusFilter = BatchJobStatus | 'all';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '전체 상태' },
  ...BATCH_STATUS_VALUES.map((v) => ({
    value: v as StatusFilter,
    label: BATCH_STATUS_LABEL[v],
  })),
];

const STATUS_VALUES: StatusFilter[] = ['all', ...BATCH_STATUS_VALUES];

function parseQueryFromURL(params: URLSearchParams): BatchJobListQuery {
  const statusRaw = params.get('status');
  const status = STATUS_VALUES.includes(statusRaw as StatusFilter)
    ? (statusRaw as StatusFilter)
    : undefined;
  const page = Number(params.get('page'));
  const limit = Number(params.get('limit'));
  return {
    status: status === 'all' ? undefined : status,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
  };
}

function serializeQuery(query: BatchJobListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit && query.limit !== DEFAULT_LIMIT)
    params.set('limit', String(query.limit));
  return params;
}

export function BatchClient() {
  const [query, setQuery] = useQuerySyncedState<BatchJobListQuery>({
    parse: parseQueryFromURL,
    serialize: serializeQuery,
  });
  const [enqueueOpen, setEnqueueOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.batchJobList(query),
    queryFn: () => aiProfileGenerator.listBatchJobs(query),
    placeholderData: keepPreviousData,
    refetchInterval: (q) => {
      const items = q.state.data?.items ?? [];
      const hasActive = items.some(
        (i) => i.status === 'pending' || i.status === 'running',
      );
      return hasActive ? POLL_INTERVAL_MS : false;
    },
  });

  const items: BatchJob[] = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const page = query.page ?? 1;
  const limit = query.limit ?? DEFAULT_LIMIT;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleStatusChange = (value: string) => {
    const next = value as StatusFilter;
    setQuery((prev) => ({
      ...prev,
      status: next === 'all' ? undefined : next,
      page: 1,
    }));
  };

  return (
    <section className="space-y-4 px-6 py-8">
      <GeneratorTabs />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">배치 생성</h1>
          <p className="mt-1 text-sm text-slate-500">
            템플릿을 기반으로 여러 Draft를 한 번에 생성합니다.
          </p>
        </div>
        <div>
          <Button onClick={() => setEnqueueOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> 새 배치 enqueue
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
        <div className="w-44">
          <Select
            value={query.status ?? 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>배치 job 목록을 불러오지 못했습니다.</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>템플릿</TableHead>
              <TableHead>진행</TableHead>
              <TableHead>실패</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="w-20 text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-sm text-slate-500"
                >
                  불러오는 중…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-sm text-slate-500"
                >
                  배치 job이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(job.id)}
                >
                  <TableCell className="font-mono text-xs text-slate-700">
                    {shortId(job.id)}
                  </TableCell>
                  <TableCell>
                    <BatchStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link
                      href={`/admin/ai-profiles/generator/templates?q=${job.templateId}`}
                      className="text-sky-700 hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {shortId(job.templateId)}
                    </Link>
                    <span className="ml-1 text-slate-500">v{job.templateVersion}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {job.completedCount} / {job.requestedCount}
                  </TableCell>
                  <TableCell className="text-xs text-rose-700">
                    {job.failedCount}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(job.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(job.id);
                      }}
                    >
                      상세
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationFooter
        total={total}
        page={page}
        totalPages={totalPages}
        disabled={listQuery.isFetching}
        onPrev={() =>
          setQuery((prev) => ({
            ...prev,
            page: Math.max(1, (prev.page ?? 1) - 1),
          }))
        }
        onNext={() =>
          setQuery((prev) => ({
            ...prev,
            page: Math.min(totalPages, (prev.page ?? 1) + 1),
          }))
        }
      />

      <BatchEnqueueDialog open={enqueueOpen} onOpenChange={setEnqueueOpen} />
      <BatchDetailDrawer
        batchJobId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </section>
  );
}
