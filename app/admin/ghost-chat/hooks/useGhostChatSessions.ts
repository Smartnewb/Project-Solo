'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ghostChat } from '@/app/services/admin/ghost-chat';
import type {
	GhostChatEvent,
	GhostChatSession,
	GhostChatSessionContext,
	GhostChatTimelineMessage,
} from '@/app/types/ghost-chat';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import {
	DEV_GHOST_CHAT_SESSIONS,
	appendDevGhostChatMessage,
	getDevGhostChatContext,
	getDevGhostChatMessages,
	getDevGhostChatSession,
} from '../mock-data';
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

const devMocksEnabled = process.env.NODE_ENV === 'development';

function timestampOf(dateString: string | null | undefined) {
	if (!dateString) return 0;
	const time = new Date(dateString).getTime();
	return Number.isFinite(time) ? time : 0;
}

function getLatestChatActivityTime(session: GhostChatSession) {
	return Math.max(
		timestampOf(session.lastUserMessageAt),
		timestampOf(session.lastAdminMessageAt),
		timestampOf(session.updatedAt),
		timestampOf(session.createdAt),
	);
}

const sortSessions = (sessions: GhostChatSession[]) =>
	[...sessions].sort((a, b) => getLatestChatActivityTime(b) - getLatestChatActivityTime(a));

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

function filterVisibleMessages(messages: GhostChatTimelineMessage[]): GhostChatTimelineMessage[] {
	return messages.filter((message) => {
		const content = message.content ?? '';
		if (message.senderType !== 'SYSTEM') return true;
		return !content.includes('채팅방을 나갔습니다');
	});
}

function getGhostChatErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof AdminApiError) {
		if (err.status === 401) return '인증이 만료되었습니다. 다시 로그인해 주세요.';
		if (err.status === 404) return 'Ghost Chat 세션을 찾을 수 없습니다. 목록을 새로고침합니다.';
		if (err.status === 409) return '다른 어드민이 먼저 배정한 세션입니다. 목록을 새로고침합니다.';
		return (err.body as { message?: string } | null)?.message ?? err.message;
	}
	return err instanceof Error ? err.message : fallback;
}

interface UseGhostChatSessionsOptions {
	ghostAccountId?: string | null;
}

export function useGhostChatSessions(options: UseGhostChatSessionsOptions = {}) {
	const [sessions, setSessions] = useState<GhostChatSession[]>([]);
	const [selectedSession, setSelectedSession] = useState<GhostChatSession | null>(null);
	const [selectedContext, setSelectedContext] = useState<GhostChatSessionContext | null>(null);
	const [selectedMessages, setSelectedMessages] = useState<GhostChatTimelineMessage[]>([]);
	const [contextMap, setContextMap] = useState<Record<string, GhostChatSessionContext>>({});
	const [previewMessageMap, setPreviewMessageMap] = useState<Record<string, GhostChatTimelineMessage[]>>({});
	const [loading, setLoading] = useState(true);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [newSessionIds, setNewSessionIds] = useState<Set<string>>(new Set());
	const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
	const [usingDevMocks, setUsingDevMocks] = useState(false);

	const selectedSessionIdRef = useRef<string | null>(null);
	const sessionsRef = useRef<GhostChatSession[]>([]);
	const hydratedSessionIdsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		selectedSessionIdRef.current = selectedSession?.id ?? null;
	}, [selectedSession?.id]);

	useEffect(() => {
		sessionsRef.current = sessions;
	}, [sessions]);

	const refreshSessions = useCallback(async (refreshOptions: { preserveError?: boolean } = {}) => {
		try {
			if (!refreshOptions.preserveError) {
				setError(null);
			}
			const nextSessions = await ghostChat.listSessions(
				options.ghostAccountId
					? { ghostAccountId: options.ghostAccountId, stateScope: 'all' }
					: undefined,
			);
			if (devMocksEnabled && nextSessions.length === 0) {
				setUsingDevMocks(true);
				setSessions(sortSessions(DEV_GHOST_CHAT_SESSIONS));
				return;
			}
			setUsingDevMocks(false);
			setSessions(sortSessions(nextSessions));
		} catch (err) {
			if (devMocksEnabled) {
				setUsingDevMocks(true);
				setError(null);
				setSessions(sortSessions(DEV_GHOST_CHAT_SESSIONS));
				return;
			}
			setError(getGhostChatErrorMessage(err, 'Ghost Chat 세션을 불러오지 못했습니다.'));
		} finally {
			setLoading(false);
		}
	}, [options.ghostAccountId]);

	const refreshSelectedSession = useCallback(async (id: string) => {
		if (devMocksEnabled && usingDevMocks) {
			const mockSession = getDevGhostChatSession(id);
			if (!mockSession) throw new Error('Ghost Chat 목업 세션을 찾을 수 없습니다.');
			setSelectedSession(mockSession);
			return mockSession;
		}
		const nextSession = await ghostChat.getSession(id);
		setSelectedSession(nextSession);
		return nextSession;
	}, [usingDevMocks]);

	const refreshSelectedMessages = useCallback(async (id: string) => {
		setMessagesLoading(true);
		setSelectedMessages([]);
		try {
			if (devMocksEnabled) {
				const response = getDevGhostChatMessages(id);
				const visibleMessages = filterVisibleMessages(response.messages);
				setSelectedMessages(visibleMessages);
				setPreviewMessageMap((current) => ({ ...current, [id]: visibleMessages.slice(-6) }));
				return visibleMessages;
			}
			const response = await ghostChat.getMessages(id, { limit: 50 });
			const visibleMessages = filterVisibleMessages(response.messages);
			setSelectedMessages(visibleMessages);
			setPreviewMessageMap((current) => ({ ...current, [id]: visibleMessages.slice(-6) }));
			return visibleMessages;
		} catch (err) {
			setSelectedMessages([]);
			setError(getGhostChatErrorMessage(err, 'Ghost Chat 메시지를 불러오지 못했습니다.'));
			return [];
		} finally {
			setMessagesLoading(false);
		}
	}, [usingDevMocks]);

	const refreshSelectedContext = useCallback(async (id: string) => {
		try {
			if (devMocksEnabled) {
				const context = getDevGhostChatContext(id);
				setSelectedContext(context);
				if (context) {
					setContextMap((current) => ({ ...current, [id]: context }));
				}
				return context;
			}
			const context = await ghostChat.getContext(id);
			setSelectedContext(context);
			setContextMap((current) => ({ ...current, [id]: context }));
			return context;
		} catch (err) {
			setSelectedContext(null);
			setError(getGhostChatErrorMessage(err, 'Ghost Chat 컨텍스트를 불러오지 못했습니다.'));
			return null;
		}
	}, [usingDevMocks]);

	const selectSession = useCallback(
		async (id: string) => {
			setActionLoadingId(id);
			try {
				setError(null);
				const nextSession = await refreshSelectedSession(id);
				await Promise.all([refreshSelectedMessages(id), refreshSelectedContext(id)]);
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
		[refreshSelectedContext, refreshSelectedMessages, refreshSelectedSession, refreshSessions],
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
					await Promise.all([refreshSelectedMessages(id), refreshSelectedContext(id)]);
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
		[refreshSelectedContext, refreshSelectedMessages, refreshSessions],
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
				if (devMocksEnabled) {
					const nextMessages = appendDevGhostChatMessage(id, trimmedContent);
					const visibleMessages = filterVisibleMessages(nextMessages);
					const mockSession = getDevGhostChatSession(id);
					if (mockSession) {
						const now = new Date().toISOString();
						const updatedSession: GhostChatSession = {
							...mockSession,
							adminMessageCount: mockSession.adminMessageCount + 1,
							lastAdminMessageAt: now,
							updatedAt: now,
						};
						setSelectedSession(updatedSession);
						setSessions((current) =>
							current.map((session) => (session.id === id ? updatedSession : session)),
						);
					}
					setSelectedMessages(visibleMessages);
					setPreviewMessageMap((current) => ({ ...current, [id]: visibleMessages.slice(-6) }));
					return;
				}
				await ghostChat.sendMessage(id, { content: trimmedContent });
				const nextSession = await ghostChat.getSession(id);
				if (selectedSessionIdRef.current === id) {
					setSelectedSession(nextSession);
					await Promise.all([refreshSelectedMessages(id), refreshSelectedContext(id)]);
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
		[refreshSelectedContext, refreshSelectedMessages, refreshSessions, usingDevMocks],
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
					await Promise.all([refreshSelectedMessages(id), refreshSelectedContext(id)]);
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
		[refreshSelectedContext, refreshSelectedMessages, refreshSelectedSession, refreshSessions],
	);

	const clearSelectedSession = useCallback(() => {
		setSelectedSession(null);
		setSelectedContext(null);
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
					void refreshSelectedContext(sessionId);
				}
				void refreshSessions();
				return;
			}

			if (event.type === 'session_closed') {
				void refreshSessions();
				if (sessionId && selectedSessionIdRef.current === sessionId) {
					void refreshSelectedSession(sessionId);
					void refreshSelectedMessages(sessionId);
					void refreshSelectedContext(sessionId);
				}
			}
		},
		[refreshSelectedContext, refreshSelectedMessages, refreshSelectedSession, refreshSessions],
	);

	const events = useGhostChatEvents({
		onEvent: handleEvent,
		onReconnect: refreshSessions,
	});

	useEffect(() => {
		void refreshSessions();
	}, [refreshSessions]);

	useEffect(() => {
		if (sessions.length === 0) return;
		let cancelled = false;
		const ids = sessions
			.filter((session) => session.state !== 'CLOSED')
			.map((session) => session.id)
			.filter((id) => !hydratedSessionIdsRef.current.has(id));
		if (ids.length === 0) return;
		ids.forEach((id) => hydratedSessionIdsRef.current.add(id));

		async function hydrateQueueCards() {
			const chunkSize = 6;
			for (let start = 0; start < ids.length; start += chunkSize) {
				const chunk = ids.slice(start, start + chunkSize);
				const entries = await Promise.all(
					chunk.map(async (id) => {
						try {
							const [context, messageResponse] = devMocksEnabled
								? [
									getDevGhostChatContext(id),
									getDevGhostChatMessages(id),
								]
								: await Promise.all([
									ghostChat.getContext(id),
									ghostChat.getMessages(id, { limit: 6 }),
								]);
							return {
								id,
								context,
								messages: filterVisibleMessages(messageResponse.messages).slice(-6),
							};
						} catch {
							return null;
						}
					}),
				);
				if (cancelled) return;
				setContextMap((current) => {
					const next = { ...current };
					for (const entry of entries) {
						if (entry?.context) next[entry.id] = entry.context;
					}
					return next;
				});
				setPreviewMessageMap((current) => {
					const next = { ...current };
					for (const entry of entries) {
						if (entry) next[entry.id] = entry.messages;
					}
					return next;
				});
			}
		}

		void hydrateQueueCards();
		return () => {
			cancelled = true;
		};
	}, [sessions]);

	const statusCounts = useMemo(() => countSessions(sessions), [sessions]);

	return {
		sessions,
		selectedSession,
		selectedContext,
		selectedMessages,
		contextMap,
		previewMessageMap,
		loading,
		messagesLoading,
		error: error ?? (usingDevMocks ? null : events.error),
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
		usingDevMocks,
	};
}
