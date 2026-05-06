export type GhostChatSessionState = 'PENDING' | 'ACTIVE' | 'IDLE' | 'CLOSED';

export interface GhostChatSession {
	id: string;
	ghostAccountId: string;
	ghostUserId: string;
	targetUserId: string;
	matchId: string;
	chatRoomId: string;
	state: GhostChatSessionState;
	assignedAdminId: string | null;
	assignedAt: string | null;
	firstUserMessageAt: string | null;
	lastUserMessageAt: string | null;
	lastAdminMessageAt: string | null;
	userMessageCount: number;
	adminMessageCount: number;
	closedAt: string | null;
	closedReason: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface GhostChatOkResponse {
	ok: true;
}

export interface SendGhostMessageRequest {
	content: string;
}

export type GhostChatEventType = 'new_session' | 'new_message' | 'session_closed';

export interface GhostChatNewSessionEventData {
	sessionId: string;
	ghostAccountId: string;
	targetUserId: string;
	chatRoomId: string;
	createdAt: string;
}

export interface GhostChatEvent<T = unknown> {
	type: GhostChatEventType;
	data: T;
}

export type GhostChatConnectionState =
	| 'connecting'
	| 'connected'
	| 'reconnecting'
	| 'closed'
	| 'error';

export const GHOST_CHAT_STATE_LABELS: Record<GhostChatSessionState, string> = {
	PENDING: '대기 중',
	ACTIVE: '진행 중',
	IDLE: '응답 없음',
	CLOSED: '종료됨',
};

export type GhostChatMessageSender = 'TARGET_USER' | 'GHOST' | 'SYSTEM';
export type GhostChatMessageType = 'text' | 'image' | 'emoji' | 'voice';

export interface GhostChatTimelineMessage {
	id: string;
	chatRoomId: string;
	senderType: GhostChatMessageSender;
	senderId: string;
	content: string | null;
	messageType: GhostChatMessageType;
	mediaUrl: string | null;
	audioDuration: number | null;
	createdAt: string;
	contentLanguage: string | null;
	contentTranslated: string | null;
	translatedLanguage: string | null;
	translationStatus: string | null;
	translationErrorCode: string | null;
	translatedAt: string | null;
}

export interface GhostChatMessagesResponse {
	messages: GhostChatTimelineMessage[];
	nextCursor: string | null;
	hasMore: boolean;
}

export interface GhostChatContextRef {
	id: string | null;
	name: string | null;
}

export interface GhostChatProfileContext {
	accountId?: string;
	userId: string;
	name?: string;
	anonymousName?: string;
	age: number;
	gender: string;
	mbti: string | null;
	rank: string | null;
	introduction?: string | null;
	keywords?: string[] | null;
	university: GhostChatContextRef | null;
	department: GhostChatContextRef | null;
	primaryPhotoUrl?: string | null;
}

export interface GhostChatSessionContext {
	ghost: GhostChatProfileContext & {
		accountId: string;
		name: string;
		anonymousName: string;
	};
	target: Omit<GhostChatProfileContext, 'accountId' | 'name' | 'anonymousName'> | null;
	visibility: {
		targetSeesGhostName: string;
		realGhostNameHiddenFromTarget: boolean;
	};
}

export interface GhostChatPersonaContext {
	ghostName?: string;
	toneGuide?: string;
	safetyNotes?: string[];
	targetSummary?: string;
}
