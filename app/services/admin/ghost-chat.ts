import { adminGet, adminPost, buildAdminProxyUrl } from '@/shared/lib/http/admin-fetch';
import type {
	GhostChatMessagesResponse,
	GhostChatOkResponse,
	GhostChatSession,
	GhostChatSessionContext,
	SendGhostMessageRequest,
} from '@/app/types/ghost-chat';

const BASE = '/admin/ghost-chat';

export interface ListGhostChatSessionsQuery {
	targetType?: 'all' | 'real_female' | 'ghost';
}

export const ghostChat = {
	listSessions: (query?: ListGhostChatSessionsQuery) =>
		adminGet<GhostChatSession[]>(`${BASE}/sessions`, query ? { ...query } : undefined),
	getSession: (id: string) => adminGet<GhostChatSession>(`${BASE}/sessions/${id}`),
	getContext: (id: string) =>
		adminGet<GhostChatSessionContext>(`${BASE}/sessions/${id}/context`),
	getMessages: (id: string, query?: { limit?: number; cursor?: string }) =>
		adminGet<GhostChatMessagesResponse>(`${BASE}/sessions/${id}/messages`, query),
	assignSession: (id: string) =>
		adminPost<GhostChatOkResponse>(`${BASE}/sessions/${id}/assign`),
	sendMessage: (id: string, body: SendGhostMessageRequest) =>
		adminPost<GhostChatOkResponse>(`${BASE}/sessions/${id}/messages`, body),
	closeSession: (id: string) =>
		adminPost<GhostChatOkResponse>(`${BASE}/sessions/${id}/close`),
	eventsUrl: () => buildAdminProxyUrl(`${BASE}/events`),
};

export type GhostChatService = typeof ghostChat;
