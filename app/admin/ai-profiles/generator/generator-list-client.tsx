'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import {
  MVP_DOMAINS,
  type AiProfileDraftListQuery,
  type AiProfileDraftStatus,
} from '@/app/types/ai-profile-generator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
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
import { aiProfileGeneratorKeys } from '../_shared/query-keys';
import { formatDate, shortId } from './_shared/format';
import { PaginationFooter } from './_shared/pagination-footer';
import {
  DRAFT_STATUS_LABEL,
  DRAFT_STATUS_VALUES,
  DRAFT_STATUS_VARIANT,
} from './_shared/status';
import { useQuerySyncedState } from './_shared/use-query-synced-state';
import { DraftCreateDialog } from './draft-create-dialog';
import { GeneratorTabs } from './_tabs';

const DEFAULT_LIMIT = 20;

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: '전체 상태' },
  ...DRAFT_STATUS_VALUES.map((v) => ({ value: v, label: DRAFT_STATUS_LABEL[v] })),
];

function parseQueryFromURL(params: URLSearchParams): AiProfileDraftListQuery {
  const statusRaw = params.get('status');
  const status = DRAFT_STATUS_VALUES.includes(statusRaw as AiProfileDraftStatus)
    ? (statusRaw as AiProfileDraftStatus)
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

function serializeQuery(query: AiProfileDraftListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit && query.limit !== DEFAULT_LIMIT)
    params.set('limit', String(query.limit));
  return params;
}

export function GeneratorListClient() {
  const router = useRouter();

  const [query, setQuery] = useQuerySyncedState<AiProfileDraftListQuery>({
    parse: parseQueryFromURL,
    serialize: serializeQuery,
  });
  const [searchInput, setSearchInput] = useState<string>(() => query.q ?? '');
  const [createOpen, setCreateOpen] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const trimmed = searchInput.trim();
    if ((query.q ?? '') === trimmed) return;
    const t = setTimeout(() => {
      setQuery((prev) => ({ ...prev, q: trimmed || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, query.q]);

  const listQuery = useQuery({
    queryKey: aiProfileGeneratorKeys.draftList(query),
    queryFn: () => aiProfileGenerator.listDrafts(query),
    placeholderData: keepPreviousData,
  });

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
            AI 프로필 생성기
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            AI Companion draft를 생성·수정하고 도메인별로 생성/재생성합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> 새 Draft 생성
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ID 또는 메모 검색"
            className="w-64 pl-8"
          />
        </div>
        <div className="w-44">
          <Select
            value={query.status ?? 'all'}
            onValueChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                status:
                  value === 'all' ? undefined : (value as AiProfileDraftStatus),
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
            Draft 목록을 불러오지 못했습니다.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left font-medium">ID</th>
              <th className="px-4 py-2 text-left font-medium">상태</th>
              <th className="px-4 py-2 text-left font-medium">준비된 도메인</th>
              <th className="px-4 py-2 text-left font-medium">수정일</th>
              <th className="px-4 py-2 text-right font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  불러오는 중…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Draft가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((draft) => {
                const readyCount = MVP_DOMAINS.filter(
                  (d) => draft.domainStatus?.[d] === 'ready',
                ).length;
                return (
                  <tr
                    key={draft.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() =>
                      router.push(`/admin/ai-profiles/generator/${draft.id}`)
                    }
                  >
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">
                      {shortId(draft.id)}
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={DRAFT_STATUS_VARIANT[draft.status]}>
                        {DRAFT_STATUS_LABEL[draft.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {readyCount} / {MVP_DOMAINS.length}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {formatDate(draft.updatedAt ?? draft.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(
                            `/admin/ai-profiles/generator/${draft.id}`,
                          );
                        }}
                      >
                        편집
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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

      <DraftCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </section>
  );
}
