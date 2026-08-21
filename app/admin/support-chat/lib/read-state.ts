'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'support-chat:read-state';

type ReadMap = Record<string, number>;

function load(): ReadMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReadMap) : {};
  } catch {
    return {};
  }
}

/**
 * 어드민이 세션을 직접 열어본 시점의 messageCount 를 기억한다.
 * 저장값이 없거나 메시지가 그 뒤로 늘었으면 "미확인"으로 본다.
 * ponytail: 서버에 read 필드가 없어서 localStorage. 여러 어드민이 공유해야 하면 서버 컬럼으로 승격.
 */
export function useReadState() {
  const [readMap, setReadMap] = useState<ReadMap>({});

  useEffect(() => {
    setReadMap(load());
  }, []);

  const markRead = useCallback((sessionId: string, messageCount: number) => {
    setReadMap((prev) => {
      if (prev[sessionId] === messageCount) return prev;
      const next = { ...prev, [sessionId]: messageCount };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 저장 실패해도 화면 동작은 유지
      }
      return next;
    });
  }, []);

  const isUnread = useCallback(
    (sessionId: string, messageCount: number) => {
      const seen = readMap[sessionId];
      return seen === undefined || messageCount > seen;
    },
    [readMap]
  );

  return { isUnread, markRead };
}
