'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type {
  PromptVersion,
  PromptVersionListQuery,
  PromptVersionStatus,
} from '@/app/types/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
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
import { formatDate } from '../_shared/format';
import {
  PROMPT_VERSION_STATUS_LABEL,
  PROMPT_VERSION_STATUS_VALUES,
} from '../_shared/status';
import { GeneratorTabs } from '../_tabs';
import { useAiProfileErrorHandler } from '../_shared-error';
import { PromptVersionDetailDrawer } from './prompt-version-detail-drawer';
import { PromptVersionFormDialog } from './prompt-version-form-dialog';

const DEFAULT_LIMIT = 20;

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: '전체 상태' },
  ...PROMPT_VERSION_STATUS_VALUES.map((v) => ({
    value: v,
    label: PROMPT_VERSION_STATUS_LABEL[v],
  })),
];

const STATUS_VARIANT: Record<
  PromptVersionStatus,
  'default' | 'secondary' | 'outline'
> = {
  draft: 'secondary',
  active: 'default',
  archived: 'outline',
};

type StatusFilter = PromptVersionStatus | 'all';

function parseQueryFromURL(
  params: URLSearchParams,
): PromptVersionListQuery {
  const statusRaw = params.get('status');
  const status: StatusFilter | undefined = (
    ['draft', 'active', 'archived', 'all'] as const
  ).includes(statusRaw as StatusFilter)
    ? (statusRaw as StatusFilter)
    : undefined;

  const page = Number(params.get('page'));
  const limit = Number(params.get('limit'));

  return {
    status,
    q: params.get('q') ?? undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
  };
}

function serializeQuery(query: PromptVersionListQuery): string {
  const params = new URLSearchParams();
  if (query.status && query.status !== 'all')
    params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit && query.limit !== DEFAULT_LIMIT)
    params.set('limit', String(query.limit));
  return params.toString();
}

export function PromptVersionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.promptVersions(),
  );

  const [query, setQuery] = useState<PromptVersionListQuery>(() =>
    parseQueryFromURL(searchParams ?? new URLSearchParams()),
  );
  const [searchInput, setSearchInput] = useState<string>(() => query.q ?? '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPv, setEditingPv] = useState<PromptVersion | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const nextQs = serializeQuery(query);
    const currentQs = searchParams?.toString() ?? '';
    if (nextQs !== currentQs) {
      router.replace(nextQs ? `?${nextQs}` : '?', { scroll: false });
    }
  }, [query, router, searchParams]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if ((query.q ?? '') === trimmed) return;
    const t = setTimeout(() => {
      setQuery((prev) => ({ ...prev, q: trimmed || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, query.q]);

  const listQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.promptVersionList(query),
    queryFn: () => aiProfileGenerator.listPromptVersions(query),
    placeholderData: keepPreviousData,
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => aiProfileGenerator.activatePromptVersion(id),
    onSuccess: () => {
      toast.success('프롬프트 버전을 활성화했습니다.');
      qc.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.promptVersions(),
      });
    },
    onError: handleError,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => aiProfileGenerator.archivePromptVersion(id),
    onSuccess: () => {
      toast.success('프롬프트 버전을 아카이브했습니다.');
      qc.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.promptVersions(),
      });
    },
    onError: handleError,
  });

  const handleCreate = () => {
    setEditingPv(null);
    setDialogOpen(true);
  };

  const handleEdit = (pv: PromptVersion) => {
    setEditingPv(pv);
    setDialogOpen(true);
  };

  const handleActivate = async (pv: PromptVersion) => {
    const ok = await confirm({
      title: '프롬프트 버전 활성화',
      message: `"${pv.name}" 을 활성화하시겠습니까? 활성화 시 현재 active 버전은 자동으로 archive 됩니다.`,
      confirmText: '활성화',
      cancelText: '취소',
      severity: 'warning',
    });
    if (ok) activateMutation.mutate(pv.id);
  };

  const handleArchive = async (pv: PromptVersion) => {
    const ok = await confirm({
      title: '프롬프트 버전 아카이브',
      message: `"${pv.name}" 을 아카이브하시겠습니까?`,
      confirmText: '아카이브',
      cancelText: '취소',
      severity: 'warning',
    });
    if (ok) archiveMutation.mutate(pv.id);
  };

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const page = query.page ?? 1;
  const limit = query.limit ?? DEFAULT_LIMIT;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="space-y-4 px-6 py-8">
      <GeneratorTabs />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            프롬프트 버전 관리
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            AI 프로필 생성 엔진에 사용되는 프롬프트 구성을 버전 단위로
            관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-1 h-4 w-4" /> 새 프롬프트 버전
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="이름 검색"
            className="w-64 pl-8"
          />
        </div>
        <div className="w-44">
          <Select
            value={query.status ?? 'all'}
            onValueChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                status: value === 'all' ? undefined : (value as StatusFilter),
                page: 1,
              }))
            }
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
          <AlertDescription>
            프롬프트 버전 목록을 불러오지 못했습니다.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead className="w-24">상태</TableHead>
              <TableHead className="w-16 text-right">버전</TableHead>
              <TableHead className="w-40">생성일</TableHead>
              <TableHead className="w-40">활성화일</TableHead>
              <TableHead className="w-72 text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell colSpan={6}>
                    <div className="h-6 animate-pulse rounded bg-slate-100" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-slate-400"
                >
                  프롬프트 버전이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((pv) => {
                return (
                  <TableRow key={pv.id}>
                    <TableCell className="font-medium text-slate-900">
                      {pv.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[pv.status]}>
                        {PROMPT_VERSION_STATUS_LABEL[pv.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-600">
                      v{pv.version}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(pv.createdAt)}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(pv.activatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {pv.status === 'draft' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(pv)}
                            >
                              편집
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(pv)}
                            >
                              활성화
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(pv)}
                            >
                              아카이브
                            </Button>
                          </>
                        ) : pv.status === 'active' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailId(pv.id)}
                            >
                              상세
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(pv)}
                            >
                              아카이브
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailId(pv.id)}
                          >
                            상세
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          전체 <span className="font-semibold text-slate-800">{total}</span>개 ·
          Page {page} / {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || listQuery.isFetching}
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                page: Math.max(1, (prev.page ?? 1) - 1),
              }))
            }
          >
            <ChevronLeft className="h-4 w-4" /> 이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || listQuery.isFetching}
            onClick={() =>
              setQuery((prev) => ({
                ...prev,
                page: Math.min(totalPages, (prev.page ?? 1) + 1),
              }))
            }
          >
            다음 <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PromptVersionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promptVersion={editingPv}
      />

      <PromptVersionDetailDrawer
        promptVersionId={detailId}
        onClose={() => setDetailId(null)}
      />
    </section>
  );
}
