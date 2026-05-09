import type {
	GhostChatMessagesResponse,
	GhostChatSession,
	GhostChatSessionContext,
	GhostChatTimelineMessage,
} from '@/app/types/ghost-chat';

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

export interface DevGhostChatTargetPreview {
	name: string;
	subtitle: string;
	photoUrl: string;
	tags: string[];
}

export const DEV_GHOST_CHAT_SESSIONS: GhostChatSession[] = [
	{
		id: 'dev-session-001',
		ghostAccountId: 'ghost-account-harin',
		ghostUserId: 'ghost-user-harin',
		targetUserId: 'target-user-minjun',
		matchId: 'match-dev-001',
		chatRoomId: 'room-dev-001',
		state: 'ACTIVE',
		assignedAdminId: null,
		assignedAt: null,
		firstUserMessageAt: iso(92),
		lastUserMessageAt: iso(4),
		lastAdminMessageAt: iso(38),
		userMessageCount: 5,
		adminMessageCount: 3,
		closedAt: null,
		closedReason: null,
		createdAt: iso(180),
		updatedAt: iso(4),
		deletedAt: null,
	},
	{
		id: 'dev-session-002',
		ghostAccountId: 'ghost-account-seoyeon',
		ghostUserId: 'ghost-user-seoyeon',
		targetUserId: 'target-user-jaehyun',
		matchId: 'match-dev-002',
		chatRoomId: 'room-dev-002',
		state: 'ACTIVE',
		assignedAdminId: null,
		assignedAt: null,
		firstUserMessageAt: iso(240),
		lastUserMessageAt: iso(11),
		lastAdminMessageAt: iso(17),
		userMessageCount: 8,
		adminMessageCount: 7,
		closedAt: null,
		closedReason: null,
		createdAt: iso(300),
		updatedAt: iso(11),
		deletedAt: null,
	},
	{
		id: 'dev-session-003',
		ghostAccountId: 'ghost-account-yuna',
		ghostUserId: 'ghost-user-yuna',
		targetUserId: 'target-user-dohyun',
		matchId: 'match-dev-003',
		chatRoomId: 'room-dev-003',
		state: 'ACTIVE',
		assignedAdminId: null,
		assignedAt: null,
		firstUserMessageAt: iso(53),
		lastUserMessageAt: iso(19),
		lastAdminMessageAt: null,
		userMessageCount: 2,
		adminMessageCount: 0,
		closedAt: null,
		closedReason: null,
		createdAt: iso(70),
		updatedAt: iso(19),
		deletedAt: null,
	},
	{
		id: 'dev-session-004',
		ghostAccountId: 'ghost-account-jieun',
		ghostUserId: 'ghost-user-jieun',
		targetUserId: 'target-user-hyunwoo',
		matchId: 'match-dev-004',
		chatRoomId: 'room-dev-004',
		state: 'IDLE',
		assignedAdminId: null,
		assignedAt: null,
		firstUserMessageAt: iso(620),
		lastUserMessageAt: iso(144),
		lastAdminMessageAt: iso(180),
		userMessageCount: 4,
		adminMessageCount: 4,
		closedAt: null,
		closedReason: null,
		createdAt: iso(720),
		updatedAt: iso(144),
		deletedAt: null,
	},
	{
		id: 'dev-session-005',
		ghostAccountId: 'ghost-account-soobin',
		ghostUserId: 'ghost-user-soobin',
		targetUserId: 'target-user-taemin',
		matchId: 'match-dev-005',
		chatRoomId: 'room-dev-005',
		state: 'ACTIVE',
		assignedAdminId: null,
		assignedAt: null,
		firstUserMessageAt: iso(35),
		lastUserMessageAt: iso(7),
		lastAdminMessageAt: iso(9),
		userMessageCount: 3,
		adminMessageCount: 3,
		closedAt: null,
		closedReason: null,
		createdAt: iso(60),
		updatedAt: iso(7),
		deletedAt: null,
	},
	{
		id: 'dev-session-006',
		ghostAccountId: 'ghost-account-mina',
		ghostUserId: 'ghost-user-mina',
		targetUserId: 'target-user-seungjae',
		matchId: 'match-dev-006',
		chatRoomId: 'room-dev-006',
		state: 'ACTIVE',
		assignedAdminId: null,
		assignedAt: null,
		firstUserMessageAt: iso(420),
		lastUserMessageAt: iso(33),
		lastAdminMessageAt: iso(36),
		userMessageCount: 6,
		adminMessageCount: 6,
		closedAt: null,
		closedReason: null,
		createdAt: iso(500),
		updatedAt: iso(33),
		deletedAt: null,
	},
];

const contexts: Record<string, GhostChatSessionContext> = {
	'dev-session-001': {
		ghost: {
			accountId: 'ghost-account-harin',
			userId: 'ghost-user-harin',
			name: '김하린',
			anonymousName: '하린',
			age: 22,
			gender: 'FEMALE',
			mbti: 'ENFP',
			rank: 'A',
			introduction: '카페 탐방이랑 전시 보는 걸 좋아해요. 답장은 자연스럽고 장난기 있게.',
			keywords: ['카페', '전시', '밝은 톤'],
			university: { id: 'univ-001', name: '연세대학교' },
			department: { id: 'dept-001', name: '심리학과' },
			primaryPhotoUrl: 'https://i.pravatar.cc/160?img=47',
		},
		target: {
			userId: 'target-user-minjun',
			age: 24,
			gender: 'MALE',
			mbti: 'INTJ',
			rank: 'B',
			university: { id: 'univ-002', name: '고려대학교' },
			department: { id: 'dept-002', name: '컴퓨터학과' },
		},
		visibility: { targetSeesGhostName: '하린', realGhostNameHiddenFromTarget: true },
	},
	'dev-session-002': {
		ghost: {
			accountId: 'ghost-account-seoyeon',
			userId: 'ghost-user-seoyeon',
			name: '이서연',
			anonymousName: '서연',
			age: 23,
			gender: 'FEMALE',
			mbti: 'ISFJ',
			rank: 'S',
			introduction: '차분하지만 대화가 이어지면 편하게 농담하는 스타일.',
			keywords: ['영화', '산책', '차분함'],
			university: { id: 'univ-003', name: '서울대학교' },
			department: { id: 'dept-003', name: '경영학과' },
			primaryPhotoUrl: 'https://i.pravatar.cc/160?img=32',
		},
		target: {
			userId: 'target-user-jaehyun',
			age: 25,
			gender: 'MALE',
			mbti: 'ENTP',
			rank: 'A',
			university: { id: 'univ-001', name: '연세대학교' },
			department: { id: 'dept-004', name: '경제학과' },
		},
		visibility: { targetSeesGhostName: '서연', realGhostNameHiddenFromTarget: true },
	},
};

const targetPreviews: Record<string, DevGhostChatTargetPreview> = {
	'dev-session-001': {
		name: '박민준',
		subtitle: '컴퓨터학과 3학년',
		photoUrl: 'https://i.pravatar.cc/160?img=12',
		tags: ['카페', '전시'],
	},
	'dev-session-002': {
		name: '정재현',
		subtitle: '경제학과 4학년',
		photoUrl: 'https://i.pravatar.cc/160?img=15',
		tags: ['영화', '산책'],
	},
	'dev-session-003': {
		name: '이도현',
		subtitle: '건축학과 2학년',
		photoUrl: 'https://i.pravatar.cc/160?img=18',
		tags: ['진로 고민', '답장 대기'],
	},
	'dev-session-004': {
		name: '김지우',
		subtitle: '경영학과 2학년',
		photoUrl: 'https://i.pravatar.cc/160?img=5',
		tags: ['진로 고민', '교환학생'],
	},
	'dev-session-005': {
		name: '최태민',
		subtitle: '전자공학과 3학년',
		photoUrl: 'https://i.pravatar.cc/160?img=20',
		tags: ['동아리', '저녁 약속'],
	},
	'dev-session-006': {
		name: '유승재',
		subtitle: '미디어학과 4학년',
		photoUrl: 'https://i.pravatar.cc/160?img=22',
		tags: ['취업', '편한 톤'],
	},
};

function makeMessage(
	session: GhostChatSession,
	index: number,
	senderType: GhostChatTimelineMessage['senderType'],
	content: string,
	minutesAgo: number,
): GhostChatTimelineMessage {
	return {
		id: `${session.id}-message-${index}`,
		chatRoomId: session.chatRoomId,
		senderType,
		senderId: senderType === 'GHOST' ? session.ghostUserId : session.targetUserId,
		content,
		messageType: 'text',
		mediaUrl: null,
		audioDuration: null,
		createdAt: iso(minutesAgo),
		contentLanguage: 'ko',
		contentTranslated: null,
		translatedLanguage: null,
		translationStatus: null,
		translationErrorCode: null,
		translatedAt: null,
	};
}

const messages: Record<string, GhostChatTimelineMessage[]> = Object.fromEntries(
	DEV_GHOST_CHAT_SESSIONS.map((session) => [
		session.id,
		[
			makeMessage(session, 1, 'TARGET_USER', '오늘 수업 끝나고 뭐해요?', 48),
			makeMessage(session, 2, 'GHOST', '저녁에 과제 조금 하고 카페 갈까 생각 중이에요.', 42),
			makeMessage(session, 3, 'TARGET_USER', '오 카페 좋아하세요? 저도 조용한 데 자주 가요.', 25),
			makeMessage(session, 4, 'GHOST', '좋아요. 너무 시끄러운 곳보다는 얘기하기 편한 곳이 좋더라구요.', 18),
			makeMessage(session, 5, 'TARGET_USER', '그럼 이번 주에 시간 맞으면 같이 가볼래요?', 7),
			makeMessage(session, 6, 'GHOST', '좋아요. 이번 주 목요일이나 금요일 저녁은 어때요?', 4),
		],
	]),
);

export function getDevGhostChatSession(id: string): GhostChatSession | null {
	return DEV_GHOST_CHAT_SESSIONS.find((session) => session.id === id) ?? null;
}

export function getDevGhostChatContext(id: string): GhostChatSessionContext | null {
	const session = getDevGhostChatSession(id);
	if (!session) return null;
	if (contexts[id]) return contexts[id];
	return {
		ghost: {
			accountId: session.ghostAccountId,
			userId: session.ghostUserId,
			name: '목업 고스트',
			anonymousName: '소미',
			age: 22,
			gender: 'FEMALE',
			mbti: 'INFJ',
			rank: 'A',
			introduction: '자연스럽고 부담 없는 대화를 선호하는 프로필입니다.',
			keywords: ['자연스러움', '대화', '공감'],
			university: { id: 'univ-dev', name: '성균관대학교' },
			department: { id: 'dept-dev', name: '미디어학과' },
			primaryPhotoUrl: 'https://i.pravatar.cc/160?img=29',
		},
		target: {
			userId: session.targetUserId,
			age: 24,
			gender: 'MALE',
			mbti: 'ISTP',
			rank: 'B',
			university: { id: 'univ-target', name: '한양대학교' },
			department: { id: 'dept-target', name: '전자공학과' },
		},
		visibility: { targetSeesGhostName: '소미', realGhostNameHiddenFromTarget: true },
	};
}

export function getDevGhostChatMessages(id: string): GhostChatMessagesResponse {
	return {
		messages: messages[id] ?? [],
		nextCursor: null,
		hasMore: false,
	};
}

export function getDevGhostChatMessagePreview(id: string, limit = 6): GhostChatTimelineMessage[] {
	return (messages[id] ?? []).slice(-limit);
}

export function getDevGhostChatTargetPreview(id: string): DevGhostChatTargetPreview | null {
	return targetPreviews[id] ?? null;
}

export function appendDevGhostChatMessage(sessionId: string, content: string): GhostChatTimelineMessage[] {
	const session = getDevGhostChatSession(sessionId);
	if (!session) return [];
	const next = makeMessage(session, Date.now(), 'GHOST', content, 0);
	messages[sessionId] = [...(messages[sessionId] ?? []), next];
	return messages[sessionId];
}
