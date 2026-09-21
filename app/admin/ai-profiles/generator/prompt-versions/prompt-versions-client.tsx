'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type {
  PromptVersion,
  PromptVersionListQuery,
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
  PROMPT_VERSION_STATUS_VARIANT,
} from '../_shared/status';
import { GeneratorTabs } from '../_tabs';
import { useAiProfileErrorHandler } from '../_shared-error';
import { PromptVersionDetailDrawer } from './prompt-version-detail-drawer';
import { PromptVersionFormDialog } from './prompt-version-form-dialog';

const DEFAULT_LIMIT = 20;

type ActiveFilter = 'all' | 'active' | 'archived';

const ACTIVE_OPTIONS: Array<{ value: ActiveFilter; label: string }> = [
  { value: 'all', label: '전체 상태' },
  { value: 'active', label: '활성' },
  { value: 'archived', label: '아카이브' },
];

function activeFilterToFlag(filter: ActiveFilter): boolean | undefined {
  if (filter === 'active') return true;
  if (filter === 'archived') return false;
  return undefined;
}

export function PromptVersionsClient() {
  const toast = useToast();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.promptVersions(),
  );

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [cursor, setCursor] = useState<string | undefined>();
  const [accumulated, setAccumulated] = useState<PromptVersion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPv, setEditingPv] = useState<PromptVersion | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setCursor(undefined);
      setAccumulated([]);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setCursor(undefined);
    setAccumulated([]);
  }, [activeFilter]);

  const query: PromptVersionListQuery = useMemo(
    () => ({
      q: debouncedQ || undefined,
      limit: DEFAULT_LIMIT,
      cursor,
      isActive: activeFilterToFlag(activeFilter),
    }),
    [debouncedQ, cursor, activeFilter],
  );

  const listQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.promptVersionList(query),
    queryFn: () => aiProfileGenerator.listPromptVersions(query),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!listQuery.data) return;
    const items = listQuery.data.items ?? [];
    setAccumulated((prev) => (cursor ? [...prev, ...items] : items));
  }, [listQuery.data, cursor]);

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      aiProfileGenerator.setDefaultPromptVersion(id),
    onSuccess: () => {
      toast.success('기본 프롬프트 버전으로 설정했습니다.');
      qc.invalidateQueries({
        queryKey: aiProfileGeneratorKeys.promptVersions(),
      });
      setCursor(undefined);
      setAccumulated([]);
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
      setCursor(undefined);
      setAccumulated([]);
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

  const handleSetDefault = async (pv: PromptVersion) => {
    const ok = await confirm({
      title: '기본 프롬프트 버전 설정',
      message: `"${pv.name}" 을 기본 프롬프트 버전으로 설정하시겠습니까?`,
      confirmText: '설정',
      cancelText: '취소',
      severity: 'warning',
    });
    if (ok) setDefaultMutation.mutate(pv.id);
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

  const nextCursor = listQuery.data?.nextCursor ?? null;

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
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="이름 검색"
            className="w-64 pl-8"
          />
        </div>
        <div className="w-44">
          <Select
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value as ActiveFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVE_OPTIONS.map((opt) => (
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
              <TableHead className="w-20">기본</TableHead>
              <TableHead className="w-16 text-right">버전</TableHead>
              <TableHead className="w-40">생성일</TableHead>
              <TableHead className="w-72 text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading && accumulated.length === 0 ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell colSpan={6}>
                    <div className="h-6 animate-pulse rounded bg-slate-100" />
                  </TableCell>
                </TableRow>
              ))
            ) : accumulated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-slate-400"
                >
                  프롬프트 버전이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              accumulated.map((pv) => (
                <TableRow key={pv.id}>
                  <TableCell className="font-medium text-slate-900">
                    {pv.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={PROMPT_VERSION_STATUS_VARIANT[pv.status]}>
                      {PROMPT_VERSION_STATUS_LABEL[pv.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pv.isDefault ? (
                      <Badge variant="default">기본</Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-600">
                    v{pv.version}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {formatDate(pv.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailId(pv.id)}
                      >
                        상세
                      </Button>
                      {pv.status !== 'archived' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(pv)}
                          >
                            편집
                          </Button>
                          {!pv.isDefault ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(pv)}
                            >
                              기본 설정
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchive(pv)}
                          >
                            아카이브
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>표시 중 {accumulated.length}건</span>
        {nextCursor ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(nextCursor)}
            disabled={listQuery.isFetching}
          >
            {listQuery.isFetching ? '불러오는 중…' : '더 보기'}
          </Button>
        ) : null}
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
