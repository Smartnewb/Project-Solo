'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import supportChatService from '@/app/services/support-chat';
import type { SupportSessionSummary } from '@/app/types/support-chat';

const POLLING_INTERVAL = 30_000;
const RESOLVED_FETCH_LIMIT = 100;

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
}

export function useSessionPolling(): UseSessionPollingReturn {
  const [activeSessions, setActiveSessions] = useState<SupportSessionSummary[]>([]);
  const [resolvedSessions, setResolvedSessions] = useState<SupportSessionSummary[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ waiting: 0, handling: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSessionIds, setNewSessionIds] = useState<Set<string>>(new Set());

  const prevWaitingIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  const fetchActive = useCallback(async () => {
    const [waitingRes, handlingRes, botRes] = await Promise.all([
      supportChatService.getSessions({ status: 'waiting_admin', limit: 100 }),
      supportChatService.getSessions({ status: 'admin_handling', limit: 100 }),
      supportChatService.getSessions({ status: 'bot_handling', limit: 100 }),
    ]);

    const waiting = waitingRes.sessions;
    const handling = handlingRes.sessions;
    const bot = botRes.sessions;

    const pending = [...waiting, ...bot];

    // Detect new pending (waiting_admin + bot_handling) sessions
    if (!isFirstFetchRef.current) {
      const currentPendingIds = new Set(pending.map((s) => s.sessionId));
      const newIds = new Set<string>();
      currentPendingIds.forEach((id) => {
        if (!prevWaitingIdsRef.current.has(id)) {
          newIds.add(id);
        }
      });
      if (newIds.size > 0) {
        setNewSessionIds((prev) => new Set([...prev, ...newIds]));
      }
    }
    isFirstFetchRef.current = false;
    prevWaitingIdsRef.current = new Set(pending.map((s) => s.sessionId));

    const combined = [...pending, ...handling];
    setActiveSessions(combined);
    setStatusCounts((prev) => ({
      ...prev,
      waiting: waitingRes.pagination.total,
      handling: handlingRes.pagination.total + botRes.pagination.total,
    }));

    return combined;
  }, []);

  const fetchResolved = useCallback(async () => {
    const res = await supportChatService.getSessions({
      status: 'resolved',
      page: 1,
      limit: RESOLVED_FETCH_LIMIT,
    });

    const uniqueSessions = Array.from(
      new Map(res.sessions.map((session) => [session.sessionId, session])).values()
    );

    setResolvedSessions(uniqueSessions);
    setStatusCounts((prev) => ({
      ...prev,
      resolved: res.pagination.total || uniqueSessions.length,
    }));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchActive(), fetchResolved()]);
    } catch (err) {
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
  };
}
