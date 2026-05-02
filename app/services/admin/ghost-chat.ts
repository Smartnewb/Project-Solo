import { adminGet, adminPost, buildAdminProxyUrl } from '@/shared/lib/http/admin-fetch';
import type {
	GhostChatOkResponse,
	GhostChatSession,
	SendGhostMessageRequest,
} from '@/app/types/ghost-chat';

const BASE = '/admin/ghost-chat';

export const ghostChat = {
	listSessions: () => adminGet<GhostChatSession[]>(`${BASE}/sessions`),
	getSession: (id: string) => adminGet<GhostChatSession>(`${BASE}/sessions/${id}`),
	assignSession: (id: string) =>
		adminPost<GhostChatOkResponse>(`${BASE}/sessions/${id}/assign`),
	sendMessage: (id: string, body: SendGhostMessageRequest) =>
		adminPost<GhostChatOkResponse>(`${BASE}/sessions/${id}/messages`, body),
	closeSession: (id: string) =>
		adminPost<GhostChatOkResponse>(`${BASE}/sessions/${id}/close`),
	eventsUrl: () => buildAdminProxyUrl(`${BASE}/events`),
};

export type GhostChatService = typeof ghostChat;
