'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { aiProfileGenerator } from '@/app/services/admin/ai-profile-generator';
import { aiProfileGeneratorKeys } from '../../_shared/query-keys';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface Props {
  value: string | null;
  onChange: (universityId: string | null, universityName: string | null) => void;
  limit?: number;
}

export function UniversitySearch({ value, onChange, limit = 20 }: Props) {
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

  const queryKey = aiProfileGeneratorKeys.universities({
    q: debouncedQ || undefined,
    limit,
    cursor,
  });

  const listQuery = useQuery({
    queryKey,
    queryFn: () =>
      aiProfileGenerator.listUniversities({
        q: debouncedQ || undefined,
        limit,
        cursor,
      }),
    placeholderData: keepPreviousData,
  });

  const items = listQuery.data?.items ?? [];
  const nextCursor = listQuery.data?.nextCursor;

  return (
    <div className="space-y-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="대학명 검색"
      />
      <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white">
        {items.length === 0 && !listQuery.isLoading ? (
          <p className="px-2 py-3 text-xs text-slate-500">결과가 없습니다.</p>
        ) : null}
        <ul className="divide-y divide-slate-100">
          {items.map((u) => {
            const selected = value === u.id;
            return (
              <li
                key={u.id}
                className={`flex cursor-pointer items-center justify-between px-2 py-1.5 text-sm hover:bg-slate-50 ${
                  selected ? 'bg-sky-50 text-sky-800' : 'text-slate-700'
                }`}
                onClick={() => onChange(u.id, u.name)}
              >
                <span>{u.name}</span>
                {u.region ? (
                  <span className="text-xs text-slate-500">{u.region}</span>
                ) : null}
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
