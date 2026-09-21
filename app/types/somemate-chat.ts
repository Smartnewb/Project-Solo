export interface SomemateUserSummary {
	id: string;
	name: string;
	phoneNumber: string | null;
	profileImage: string | null;
	age: number | null;
	gender: string | null;
	rank: string | null;
}

export interface SomemateCompanionSummary {
	id: string;
	name: string;
	type: string;
	age: number;
	representativeImageUrl: string | null;
	personaTags: string[];
}

export interface SomemateRelationshipItem {
	id: string;
	stage: string;
	slotStatus: string;
	totalMessages: number;
	totalGemsSpent: number;
	lastInteractionAt: string | null;
	unlockedAt: string;
	user: SomemateUserSummary;
	companion: SomemateCompanionSummary;
	latestMessage: string | null;
}

export interface SomemateRelationshipListResponse {
	items: SomemateRelationshipItem[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasMore: boolean;
	};
}

export interface SomemateMessageItem {
	id: string;
	relationshipId: string;
	role: 'user' | 'assistant' | string;
	content: string;
	trigger: string;
	contentTier: string | null;
	attachments: unknown;
	createdAt: string;
}

export interface SomemateMessagesResponse {
	items: SomemateMessageItem[];
	limit: number;
}
