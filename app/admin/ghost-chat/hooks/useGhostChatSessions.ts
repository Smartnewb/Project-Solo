'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ghostChat } from '@/app/services/admin/ghost-chat';
import type {
	GhostChatEvent,
	GhostChatSession,
	GhostChatTimelineMessage,
} from '@/app/types/ghost-chat';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
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

function getGhostChatErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof AdminApiError) {
		if (err.status === 401) return '인증이 만료되었습니다. 다시 로그인해 주세요.';
		if (err.status === 404) return 'Ghost Chat 세션을 찾을 수 없습니다. 목록을 새로고침합니다.';
		if (err.status === 409) return '다른 어드민이 먼저 배정한 세션입니다. 목록을 새로고침합니다.';
		return (err.body as { message?: string } | null)?.message ?? err.message;
	}
	return err instanceof Error ? err.message : fallback;
}

export function useGhostChatSessions() {
	const [sessions, setSessions] = useState<GhostChatSession[]>([]);
	const [selectedSession, setSelectedSession] = useState<GhostChatSession | null>(null);
	const [selectedMessages, setSelectedMessages] = useState<GhostChatTimelineMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [newSessionIds, setNewSessionIds] = useState<Set<string>>(new Set());
	const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

	const selectedSessionIdRef = useRef<string | null>(null);
	const sessionsRef = useRef<GhostChatSession[]>([]);

	useEffect(() => {
		selectedSessionIdRef.current = selectedSession?.id ?? null;
	}, [selectedSession?.id]);

	useEffect(() => {
		sessionsRef.current = sessions;
	}, [sessions]);

	const refreshSessions = useCallback(async (options: { preserveError?: boolean } = {}) => {
		try {
			if (!options.preserveError) {
				setError(null);
			}
			const nextSessions = await ghostChat.listSessions();
			setSessions(sortSessions(nextSessions));
		} catch (err) {
			setError(getGhostChatErrorMessage(err, 'Ghost Chat 세션을 불러오지 못했습니다.'));
		} finally {
			setLoading(false);
		}
	}, []);

	const refreshSelectedSession = useCallback(async (id: string) => {
		const nextSession = await ghostChat.getSession(id);
		setSelectedSession(nextSession);
		return nextSession;
	}, []);

	const refreshSelectedMessages = useCallback(async (id: string) => {
		setMessagesLoading(true);
		setSelectedMessages([]);
		try {
			const response = await ghostChat.getMessages(id, { limit: 50 });
			setSelectedMessages(response.messages);
			return response.messages;
		} catch (err) {
			setSelectedMessages([]);
			setError(getGhostChatErrorMessage(err, 'Ghost Chat 메시지를 불러오지 못했습니다.'));
			return [];
		} finally {
			setMessagesLoading(false);
		}
	}, []);

	const selectSession = useCallback(
		async (id: string) => {
			setActionLoadingId(id);
			try {
				setError(null);
				const nextSession = await refreshSelectedSession(id);
				await refreshSelectedMessages(id);
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
				setError(getGhostChatErrorMessage(err, 'Ghost Chat 세션 상세를 불러오지 못했습니다.'));
				if (err instanceof AdminApiError && err.status === 404) {
					setSelectedSession(null);
					await refreshSessions({ preserveError: true });
				}
				throw err;
			} finally {
				setActionLoadingId(null);
			}
		},
		[refreshSelectedMessages, refreshSelectedSession, refreshSessions],
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
					await refreshSelectedMessages(id);
				}
				await refreshSessions();
			} catch (err) {
				setError(getGhostChatErrorMessage(err, 'Ghost Chat 세션 배정에 실패했습니다.'));
				if (err instanceof AdminApiError && (err.status === 404 || err.status === 409)) {
					await refreshSessions({ preserveError: true });
				}
				throw err;
			} finally {
				setActionLoadingId(null);
			}
		},
		[refreshSelectedMessages, refreshSessions],
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
					await refreshSelectedMessages(id);
				}
				await refreshSessions();
			} catch (err) {
				setError(getGhostChatErrorMessage(err, 'Ghost 메시지 전송에 실패했습니다.'));
				if (err instanceof AdminApiError && err.status === 404) {
					setSelectedSession(null);
					await refreshSessions({ preserveError: true });
				}
				throw err;
			} finally {
				setActionLoadingId(null);
			}
		},
		[refreshSelectedMessages, refreshSessions],
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
					await refreshSelectedMessages(id);
				}
			} catch (err) {
				setError(getGhostChatErrorMessage(err, 'Ghost Chat 세션 종료에 실패했습니다.'));
				if (err instanceof AdminApiError && err.status === 404) {
					setSelectedSession(null);
					await refreshSessions({ preserveError: true });
				}
				throw err;
			} finally {
				setActionLoadingId(null);
			}
		},
		[refreshSelectedMessages, refreshSelectedSession, refreshSessions],
	);

	const clearSelectedSession = useCallback(() => {
		setSelectedSession(null);
		setSelectedMessages([]);
		selectedSessionIdRef.current = null;
	}, []);

	const clearSessionBadge = useCallback((id: string) => {
		setNewSessionIds((current) => {
			const next = new Set(current);
			next.delete(id);
			return next;
		});
		setUnreadMap((current) => {
			const { [id]: _cleared, ...rest } = current;
			return rest;
		});
	}, []);

	const handleEvent = useCallback(
		(event: GhostChatEvent) => {
			const sessionId = (event.data as GhostChatEventDataWithSessionId | undefined)?.sessionId;

			if (event.type === 'new_session') {
				if (sessionId) {
					const alreadyKnown = sessionsRef.current.some((session) => session.id === sessionId);
					if (!alreadyKnown) {
						setNewSessionIds((current) => {
							if (current.has(sessionId)) return current;
							return new Set(current).add(sessionId);
						});
					}
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
					void refreshSelectedMessages(sessionId);
				}
				void refreshSessions();
				return;
			}

			if (event.type === 'session_closed') {
				void refreshSessions();
				if (sessionId && selectedSessionIdRef.current === sessionId) {
					void refreshSelectedSession(sessionId);
					void refreshSelectedMessages(sessionId);
				}
			}
		},
		[refreshSelectedMessages, refreshSelectedSession, refreshSessions],
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
		selectedMessages,
		loading,
		messagesLoading,
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
		clearSelectedSession,
		clearSessionBadge,
		events,
	};
}
