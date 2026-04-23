'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
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

  const lastWrittenRef = useRef<string>(
    serialize(value).toString(),
  );

  // state → URL
  useEffect(() => {
    const currentParams = searchParams ?? new URLSearchParams();
    const owned = serialize(value);
    const ownedKeys = new Set(Array.from(owned.keys()));

    // Merge owned keys with unrelated params (utm_*, ref, etc.)
    const merged = new URLSearchParams();
    currentParams.forEach((v, k) => {
      if (!ownedKeys.has(k)) merged.append(k, v);
    });
    owned.forEach((v, k) => merged.append(k, v));

    const next = merged.toString();
    const current = currentParams.toString();
    if (next !== current) {
      lastWrittenRef.current = next;
      router.replace(next ? `?${next}` : '?', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, router]);

  // URL → state (browser back/forward, external nav)
  useEffect(() => {
    const params = searchParams ?? new URLSearchParams();
    const current = params.toString();
    if (current === lastWrittenRef.current) return;
    lastWrittenRef.current = current;
    setValue(parse(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return [value, setValue];
}
