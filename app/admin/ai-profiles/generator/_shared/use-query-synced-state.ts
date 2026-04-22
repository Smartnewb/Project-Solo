'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Options<T> {
  parse: (params: URLSearchParams) => T;
  serialize: (value: T) => URLSearchParams;
}

export function useQuerySyncedState<T>({
  parse,
  serialize,
}: Options<T>): [T, Dispatch<SetStateAction<T>>] {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<T>(() =>
    parse(searchParams ?? new URLSearchParams()),
  );

  useEffect(() => {
    const next = serialize(value).toString();
    const current = (searchParams ?? new URLSearchParams()).toString();
    if (next !== current) {
      router.replace(next ? `?${next}` : '?', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, router]);

  return [value, setValue];
}
