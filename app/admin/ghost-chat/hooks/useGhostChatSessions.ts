'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ghostChat } from '@/app/services/admin/ghost-chat';
import type { GhostChatEvent, GhostChatSession } from '@/app/types/ghost-chat';
import { useGhostChatEvents } from './useGhostChatEvents';

interface GhostChatStatusCounts {
	pending: number;
	active: number;
	idle: number;
	closed: number;
}

interface GhostChatEventDataWithSessionId {
	sessionId?: string;
}

const emptyCounts: GhostChatStatusCounts = {
	pending: 0,
	active: 0,
	idle: 0,
	closed: 0,
};

const sortSessions = (sessions: GhostChatSession[]) =>
	[...sessions].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	);

const countSessions = (sessions: GhostChatSession[]): GhostChatStatusCounts =>
	sessions.reduce(
		(counts, session) => {
			if (session.state === 'PENDING') counts.pending += 1;
			if (session.state === 'ACTIVE') counts.active += 1;
			if (session.state === 'IDLE') counts.idle += 1;
			if (session.state === 'CLOSED') counts.closed += 1;
			return counts;
		},
		{ ...emptyCounts },
	);

export function useGhostChatSessions() {
	const [sessions, setSessions] = useState<GhostChatSession[]>([]);
	const [selectedSession, setSelectedSession] = useState<GhostChatSession | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [newSessionIds, setNewSessionIds] = useState<Set<string>>(new Set());
	const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

	const selectedSessionIdRef = useRef<string | null>(null);

	useEffect(() => {
		selectedSessionIdRef.current = selectedSession?.id ?? null;
	}, [selectedSession?.id]);

	const refreshSessions = useCallback(async () => {
		try {
			setError(null);
			const nextSessions = await ghostChat.listSessions();
			setSessions(sortSessions(nextSessions));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Ghost Chat 세션을 불러오지 못했습니다.');
		} finally {
			setLoading(false);
		}
	}, []);

	const refreshSelectedSession = useCallback(async (id: string) => {
		const nextSession = await ghostChat.getSession(id);
		setSelectedSession(nextSession);
		return nextSession;
	}, []);

	const selectSession = useCallback(
		async (id: string) => {
			setActionLoadingId(id);
			try {
				setError(null);
				const nextSession = await refreshSelectedSession(id);
				setNewSessionIds((current) => {
					const next = new Set(current);
					next.delete(id);
					return next;
				});
				setUnreadMap((current) => {
					const { [id]: _cleared, ...rest } = current;
					return rest;
				});
				return nextSession;
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Ghost Chat 세션 상세를 불러오지 못했습니다.');
				throw err;
			} finally {
				setActionLoadingId(null);
			}
		},
		[refreshSelectedSession],
	);

	const assignSession = useCallback(
		async (id: string) => {
			setActionLoadingId(id);
			try {
				setError(null);
				await ghostChat.assignSession(id);
				const nextSession = await ghostChat.getSession(id);
				if (selectedSessionIdRef.current === id) {
					setSelectedSession(nextSession);
				}
				await refreshSessions();
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Ghost Chat 세션 배정에 실패했습니다.');
				throw err;
			} finally {
				setActionLoadingId(null);
			}
		},
		[refreshSessions],
	);

	const sendMessage = useCallback(
		async (id: string, content: string) => {
			const trimmedContent = content.trim();
			if (!trimmedContent) {
				throw new Error('메시지를 입력하세요.');
			}

			setActionLoadingId(id);
			try {
				setError(null);
				await ghostChat.sendMessage(id, { content: trimmedContent });
				const nextSession = await ghostChat.getSession(id);
				if (selectedSessionIdRef.current === id) {
					setSelectedSession(nextSession);
				}
				await refreshSessions();
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Ghost 메시지 전송에 실패했습니다.');
				throw err;
			} finally {
				setActionLoadingId(null);
			}
		},
		[refreshSessions],
	);

	const closeSession = useCallback(
		async (id: string) => {
			setActionLoadingId(id);
			try {
				setError(null);
				await ghostChat.closeSession(id);
				await refreshSessions();
				if (selectedSessionIdRef.current === id) {
					await refreshSelectedSession(id);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Ghost Chat 세션 종료에 실패했습니다.');
				throw err;
			} finally {
				setActionLoadingId(null);
			}
		},
		[refreshSelectedSession, refreshSessions],
	);

	const handleEvent = useCallback(
		(event: GhostChatEvent) => {
			const sessionId = (event.data as GhostChatEventDataWithSessionId | undefined)?.sessionId;

			if (event.type === 'new_session') {
				if (sessionId) {
					setNewSessionIds((current) => new Set(current).add(sessionId));
				}
				void refreshSessions();
				return;
			}

			if (event.type === 'new_message') {
				if (sessionId && selectedSessionIdRef.current !== sessionId) {
					setUnreadMap((current) => ({
						...current,
						[sessionId]: (current[sessionId] ?? 0) + 1,
					}));
				}
				if (sessionId && selectedSessionIdRef.current === sessionId) {
					void refreshSelectedSession(sessionId);
				}
				void refreshSessions();
				return;
			}

			if (event.type === 'session_closed') {
				void refreshSessions();
				if (sessionId && selectedSessionIdRef.current === sessionId) {
					void refreshSelectedSession(sessionId);
				}
			}
		},
		[refreshSelectedSession, refreshSessions],
	);

	const events = useGhostChatEvents({
		onEvent: handleEvent,
		onReconnect: refreshSessions,
	});

	useEffect(() => {
		void refreshSessions();
	}, [refreshSessions]);

	const statusCounts = useMemo(() => countSessions(sessions), [sessions]);

	return {
		sessions,
		selectedSession,
		loading,
		error: error ?? events.error,
		newSessionIds,
		unreadMap,
		statusCounts,
		actionLoadingId,
		refreshSessions,
		selectSession,
		assignSession,
		sendMessage,
		closeSession,
		events,
	};
}
