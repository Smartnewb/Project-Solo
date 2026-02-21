'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import supportChatService from '@/app/services/support-chat';
import type { SupportSessionSummary } from '@/app/types/support-chat';

const POLLING_INTERVAL = 30_000;

interface StatusCounts {
  waiting: number;
  handling: number;
  resolved: number;
}

interface UseSessionPollingReturn {
  activeSessions: SupportSessionSummary[];
  resolvedSessions: SupportSessionSummary[];
  statusCounts: StatusCounts;
  loading: boolean;
  error: string | null;
  newSessionIds: Set<string>;
  clearNewSessionIds: () => void;
  refresh: () => Promise<void>;
  resolvedPage: number;
  resolvedTotal: number;
  setResolvedPage: (page: number) => void;
}

export function useSessionPolling(): UseSessionPollingReturn {
  const [activeSessions, setActiveSessions] = useState<SupportSessionSummary[]>([]);
  const [resolvedSessions, setResolvedSessions] = useState<SupportSessionSummary[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ waiting: 0, handling: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSessionIds, setNewSessionIds] = useState<Set<string>>(new Set());
  const [resolvedPage, setResolvedPage] = useState(1);
  const [resolvedTotal, setResolvedTotal] = useState(0);

  const prevWaitingIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  const fetchActive = useCallback(async () => {
    const [waitingRes, handlingRes] = await Promise.all([
      supportChatService.getSessions({ status: 'waiting_admin', limit: 100 }),
      supportChatService.getSessions({ status: 'admin_handling', limit: 100 }),
    ]);

    const waiting = waitingRes.sessions;
    const handling = handlingRes.sessions;

    // Detect new waiting sessions
    if (!isFirstFetchRef.current) {
      const currentWaitingIds = new Set(waiting.map((s) => s.sessionId));
      const newIds = new Set<string>();
      currentWaitingIds.forEach((id) => {
        if (!prevWaitingIdsRef.current.has(id)) {
          newIds.add(id);
        }
      });
      if (newIds.size > 0) {
        setNewSessionIds((prev) => new Set([...prev, ...newIds]));
      }
    }
    isFirstFetchRef.current = false;
    prevWaitingIdsRef.current = new Set(waiting.map((s) => s.sessionId));

    const combined = [...waiting, ...handling];
    setActiveSessions(combined);
    setStatusCounts((prev) => ({
      ...prev,
      waiting: waitingRes.pagination.total,
      handling: handlingRes.pagination.total,
    }));

    return combined;
  }, []);

  const fetchResolved = useCallback(async () => {
    const res = await supportChatService.getSessions({
      status: 'resolved',
      page: resolvedPage,
      limit: 20,
    });
    setResolvedSessions(res.sessions);
    setResolvedTotal(res.pagination.total);
    setStatusCounts((prev) => ({ ...prev, resolved: res.pagination.total }));
  }, [resolvedPage]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchActive(), fetchResolved()]);
    } catch (err) {
      console.error('세션 폴링 실패:', err);
      setError(err instanceof Error ? err.message : '세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fetchActive, fetchResolved]);

  const clearNewSessionIds = useCallback(() => {
    setNewSessionIds(new Set());
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      refresh();
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    activeSessions,
    resolvedSessions,
    statusCounts,
    loading,
    error,
    newSessionIds,
    clearNewSessionIds,
    refresh,
    resolvedPage,
    resolvedTotal,
    setResolvedPage,
  };
}
