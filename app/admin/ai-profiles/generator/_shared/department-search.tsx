'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface Props {
  universityId: string | null;
  value: string | null;
  onChange: (departmentId: string | null, departmentName: string | null) => void;
  limit?: number;
}

export function DepartmentSearch({
  universityId,
  value,
  onChange,
  limit = 20,
}: Props) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setCursor(undefined);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setQ('');
    setDebouncedQ('');
    setCursor(undefined);
  }, [universityId]);

  const queryKey = universityId
    ? aiProfileGeneratorKeys.departments(universityId, {
        q: debouncedQ || undefined,
        limit,
        cursor,
      })
    : ['admin', 'ai-profile-generator', 'departments', 'none'] as const;

  const listQuery = useQuery({
    queryKey,
    queryFn: () =>
      universityId
        ? aiProfileGenerator.listDepartments(universityId, {
            q: debouncedQ || undefined,
            limit,
            cursor,
          })
        : Promise.resolve({ items: [], nextCursor: null }),
    enabled: Boolean(universityId),
    placeholderData: keepPreviousData,
  });

  const items = listQuery.data?.items ?? [];
  const nextCursor = listQuery.data?.nextCursor;

  if (!universityId) {
    return (
      <p className="text-xs text-slate-500">
        먼저 대학을 선택하면 학과를 검색할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="학과명 검색"
      />
      <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white">
        {items.length === 0 && !listQuery.isLoading ? (
          <p className="px-2 py-3 text-xs text-slate-500">결과가 없습니다.</p>
        ) : null}
        <ul className="divide-y divide-slate-100">
          {items.map((d) => {
            const selected = value === d.id;
            return (
              <li
                key={d.id}
                className={`cursor-pointer px-2 py-1.5 text-sm hover:bg-slate-50 ${
                  selected ? 'bg-sky-50 text-sky-800' : 'text-slate-700'
                }`}
                onClick={() => onChange(d.id, d.name)}
              >
                {d.name}
              </li>
            );
          })}
        </ul>
      </div>
      {nextCursor ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCursor(nextCursor)}
          disabled={listQuery.isFetching}
        >
          더 보기
        </Button>
      ) : null}
    </div>
  );
}
