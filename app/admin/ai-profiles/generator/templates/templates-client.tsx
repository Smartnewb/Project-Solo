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
import { GeneratorTabs } from '../_tabs';
import { useAiProfileErrorHandler } from '../_shared-error';
import { TemplateFormDialog } from './template-form-dialog';
import { TemplateTable } from './template-table';

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

export function TemplatesClient() {
  const toast = useToast();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const handleError = useAiProfileErrorHandler(
    aiProfileGeneratorKeys.templates(),
  );

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [cursor, setCursor] = useState<string | undefined>();
  const [accumulated, setAccumulated] = useState<AiProfileTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<AiProfileTemplate | null>(null);

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

  const query: TemplateListQuery = useMemo(
    () => ({
      q: debouncedQ || undefined,
      limit: DEFAULT_LIMIT,
      cursor,
      isActive: activeFilterToFlag(activeFilter),
    }),
    [debouncedQ, cursor, activeFilter],
  );

  const listQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.templateList(query),
    queryFn: () => aiProfileGenerator.listGenerationTemplates(query),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!listQuery.data) return;
    setAccumulated((prev) =>
      cursor ? [...prev, ...listQuery.data.items] : listQuery.data.items,
    );
  }, [listQuery.data, cursor]);

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      aiProfileGenerator.archiveGenerationTemplate(id),
    onSuccess: () => {
      toast.success('템플릿을 아카이브했습니다.');
      qc.invalidateQueries({ queryKey: aiProfileGeneratorKeys.templates() });
      setCursor(undefined);
      setAccumulated([]);
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

  const nextCursor = listQuery.data?.nextCursor ?? null;

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
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="이름 또는 설명 검색"
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
            템플릿 목록을 불러오지 못했습니다.
          </AlertDescription>
        </Alert>
      ) : null}

      <TemplateTable
        items={accumulated}
        isLoading={listQuery.isLoading && accumulated.length === 0}
        onEdit={handleEdit}
        onArchive={handleArchive}
      />

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

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
      />
    </section>
  );
}
