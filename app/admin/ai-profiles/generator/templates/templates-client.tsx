'use client';

import { useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import type {
  AiProfileTemplate,
  TemplateListQuery,
} from '@/app/types/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog';
import { useToast } from '@/shared/ui/admin/toast';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { PaginationFooter } from '../_shared/pagination-footer';
import { useQuerySyncedState } from '../_shared/use-query-synced-state';
import { GeneratorTabs } from '../_tabs';
import { useAiProfileErrorHandler } from '../_shared-error';
import { TemplateFormDialog } from './template-form-dialog';
import { TemplateTable } from './template-table';

const DEFAULT_LIMIT = 20;

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: '전체 상태' },
  { value: 'active', label: '활성' },
  { value: 'archived', label: '아카이브' },
];

type StatusFilter = 'active' | 'archived' | 'all';

function parseQueryFromURL(params: URLSearchParams): TemplateListQuery {
  const statusRaw = params.get('status');
  const status: StatusFilter | undefined = (
    ['active', 'archived', 'all'] as const
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

function serializeQuery(query: TemplateListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.status && query.status !== 'all') params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit && query.limit !== DEFAULT_LIMIT)
    params.set('limit', String(query.limit));
  return params;
}

export function TemplatesClient() {
  const toast = useToast();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.templates(),
  );

  const [query, setQuery] = useQuerySyncedState<TemplateListQuery>({
    parse: parseQueryFromURL,
    serialize: serializeQuery,
  });
  const [searchInput, setSearchInput] = useState<string>(() => query.q ?? '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<AiProfileTemplate | null>(null);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if ((query.q ?? '') === trimmed) return;
    const t = setTimeout(() => {
      setQuery((prev) => ({ ...prev, q: trimmed || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, query.q]);

  const listQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.templateList(query),
    queryFn: () => aiProfileGenerator.listTemplatesPaged(query),
    placeholderData: keepPreviousData,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => aiProfileGenerator.archiveGenerationTemplate(id),
    onSuccess: () => {
      toast.success('템플릿을 아카이브했습니다.');
      qc.invalidateQueries({ queryKey: aiProfileGeneratorKeys.templates() });
    },
    onError: handleError,
  });

  const handleCreate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = (template: AiProfileTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleArchive = async (template: AiProfileTemplate) => {
    const ok = await confirm({
      title: '템플릿 아카이브',
      message: `"${template.name}" 템플릿을 아카이브하시겠습니까? 아카이브 상태에서는 새 Draft에 사용할 수 없습니다.`,
      confirmText: '아카이브',
      cancelText: '취소',
      severity: 'warning',
    });
    if (ok) archiveMutation.mutate(template.id);
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
          <h1 className="text-2xl font-semibold text-slate-900">템플릿 관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            AI 프로필 생성에 사용하는 템플릿을 생성하고 버전을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-1 h-4 w-4" /> 새 템플릿
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="이름 또는 설명 검색"
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
            템플릿 목록을 불러오지 못했습니다.
          </AlertDescription>
        </Alert>
      ) : null}

      <TemplateTable
        items={items}
        isLoading={listQuery.isLoading}
        onEdit={handleEdit}
        onArchive={handleArchive}
      />

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

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
      />
    </section>
  );
}
