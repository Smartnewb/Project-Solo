import { adminGet } from '@/shared/lib/http/admin-fetch';
import type {
	SomemateMessagesResponse,
	SomemateRelationshipListResponse,
} from '@/app/types/somemate-chat';

const BASE = '/admin/v2/somemate-chat';

export interface ListSomemateRelationshipsQuery {
	q?: string;
	userId?: string;
	companionId?: string;
	page?: number;
	limit?: number;
}

export const somemateChat = {
	listRelationships: async (query: ListSomemateRelationshipsQuery = {}) => {
		const result = await adminGet<{ data: SomemateRelationshipListResponse }>(
			`${BASE}/relationships`,
			{ ...query },
		);
		return result.data;
	},
	getMessages: async (relationshipId: string, query?: { limit?: number }) => {
		const result = await adminGet<{ data: SomemateMessagesResponse }>(
			`${BASE}/relationships/${relationshipId}/messages`,
			query,
		);
		return result.data;
	},
};

export type SomemateChatService = typeof somemateChat;
