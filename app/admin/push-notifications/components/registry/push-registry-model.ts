import type { PushRegistryNotificationEntry } from '@/app/services/admin/push-notification-registry';

export type PushRegistryView = 'table' | 'graph';

export type RegistryRow = {
	eventType: string;
	entry: PushRegistryNotificationEntry;
};

export type RegistryFilters = {
	search: string;
	category: string;
	eventType: string;
	trigger: string;
	audience: string;
	persistence: string;
	throttle: string;
	suppressInRoom: string;
	direct: string;
};

export const initialRegistryFilters: RegistryFilters = {
	search: '',
	category: 'all',
	eventType: 'all',
	trigger: 'all',
	audience: 'all',
	persistence: 'all',
	throttle: 'all',
	suppressInRoom: 'all',
	direct: 'all',
};

const CATEGORY_LABELS: Record<string, string> = {
	campaign: '캠페인',
	chat: '채팅',
	community: '커뮤니티',
	matching: '매칭',
	reminder: '리마인더',
	system: '시스템',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
	campaign: '캠페인 참여, 추천 확인, 썸메이트 재방문처럼 특정 조건에 맞는 유저를 찾아 보냅니다.',
	chat: '채팅방 생성이나 새 메시지처럼 대화 흐름에서 바로 확인해야 하는 알림입니다.',
	community: '게시글, 댓글, 좋아요, 상담소처럼 커뮤니티 활동에 반응해 보냅니다.',
	matching: '매칭 결과, 좋아요, 연결, 프로필 조회처럼 인연 탐색 과정에서 보냅니다.',
	reminder: '프로필 제출, 모먼트, 룰렛처럼 사용자가 놓치기 쉬운 행동을 다시 알려줍니다.',
	system: '승인, 반려, 운영 공지, 고객지원처럼 서비스 운영 상태 변화에 맞춰 보냅니다.',
};

const AUDIENCE_LABELS: Record<string, string> = {
	campaignIncompleteFemales: '캠페인 참여가 끝나지 않은 여성 유저',
	somemateResumeCandidates: '썸메이트 대화를 다시 이어갈 가능성이 있는 유저',
	somemateDiscoveryCandidates: '새 썸메이트 추천을 볼 수 있는 유저',
	somemateRehearsalPromptCandidates: '썸메이트 대화 연습이 필요한 유저',
};

const EVENT_DESCRIPTIONS: Record<string, string> = {
	admin_bulk_notification: '운영자가 여러 유저에게 공지성 알림을 보낼 때 발송됩니다.',
	admin_notice: '운영 공지나 중요 안내가 등록되면 대상 유저에게 보냅니다.',
	campaign_reminder: '캠페인 참여가 끝나지 않은 유저에게 오늘 확인할 추천이 남아 있을 때 보냅니다.',
	card_news: '커뮤니티 카드 뉴스나 운영 콘텐츠가 공개되면 관심 유저에게 보냅니다.',
	chat_message: '새 채팅 메시지가 도착하면 상대가 채팅방 안에 있지 않을 때 보냅니다.',
	chat_room_created: '새 채팅방이 만들어지면 참여자에게 대화를 시작하라고 알려줍니다.',
	comment: '커뮤니티 게시글에 새 댓글이 달리면 게시글 작성자에게 보냅니다.',
	comment_like: '내 댓글에 좋아요가 눌리면 댓글 작성자에게 보냅니다.',
	contact: '연락처 확인이나 교환 관련 액션이 생기면 대상 유저에게 보냅니다.',
	like: '내 게시글이나 커뮤니티 콘텐츠에 좋아요가 눌리면 작성자에게 보냅니다.',
	match_connection: '서로 연결 가능한 상태가 되면 대화를 이어가도록 보냅니다.',
	match_like: '누군가 나에게 호감을 표시하면 해당 유저에게 보냅니다.',
	matching_available: '새 매칭을 받을 수 있는 상태가 되면 유저에게 알려줍니다.',
	matching_preview: '곧 확인할 수 있는 매칭 후보가 있을 때 미리 알려줍니다.',
	matching_result: '매칭 결과가 준비되면 결과 확인 화면으로 유도합니다.',
	moment_reminder: '모먼트 참여나 확인을 놓친 유저에게 다시 알려줍니다.',
	profile_image_approved: '프로필 사진 심사가 승인되면 결과를 알려줍니다.',
	profile_image_rejected: '프로필 사진 심사가 반려되면 수정이 필요하다고 알려줍니다.',
	profile_submit_reminder: '가입 후 프로필 제출을 끝내지 않은 유저에게 제출을 유도합니다.',
	profile_view: '내 프로필을 누군가 확인했을 때 관심 신호로 알려줍니다.',
	reply: '내 댓글에 답글이 달리면 댓글 작성자에게 보냅니다.',
	roulette_reminder: '룰렛 이벤트 참여를 놓친 유저에게 참여 가능 시간을 알려줍니다.',
	somemate_discovery: '새로운 썸메이트 후보를 볼 수 있는 유저에게 추천 확인을 유도합니다.',
	somemate_rehearsal_prompt: '썸메이트 대화 연습이 필요한 유저에게 연습 시작을 유도합니다.',
	somemate_resume: '중단된 썸메이트 대화를 다시 이어갈 만한 유저에게 보냅니다.',
	user_approval: '가입 심사가 승인되면 앱을 바로 이용할 수 있다고 알려줍니다.',
	user_rejection: '가입 심사가 반려되면 사유 확인과 재제출을 안내합니다.',
};

export const formatCategoryName = (category: string): string => CATEGORY_LABELS[category] ?? category;

export const describeCategory = (category: string): string =>
	CATEGORY_DESCRIPTIONS[category] ?? `${formatCategoryName(category)} 영역에서 발생하는 상황별 알림입니다.`;

export const formatTrigger = (entry: PushRegistryNotificationEntry): string => {
	if (entry.trigger.type === 'cron') {
		return `${entry.trigger.schedule} · ${entry.trigger.timeZone ?? 'timezone 없음'}`;
	}
	return 'event';
};

export const formatAudience = (entry: PushRegistryNotificationEntry): string =>
	entry.audience.type === 'query' ? entry.audience.resolver : 'single';

export const formatTriggerKo = (entry: PushRegistryNotificationEntry): string => {
	if (entry.trigger.type === 'cron') {
		return `${entry.trigger.schedule}에 자동 발송 (${entry.trigger.timeZone ?? '시간대 없음'})`;
	}
	return '앱/서버 이벤트가 발생하면 즉시 발송';
};

export const formatAudienceKo = (entry: PushRegistryNotificationEntry): string => {
	if (entry.audience.type === 'query') {
		return AUDIENCE_LABELS[entry.audience.resolver] ?? `조건 조회 대상 (${entry.audience.resolver})`;
	}
	return '이벤트와 연결된 특정 유저 1명';
};

export const formatPersistence = (entry: PushRegistryNotificationEntry): string =>
	entry.persistence ? `${entry.persistence.type}/${entry.persistence.subType}` : '저장 안 함';

export const formatThrottle = (entry: Pick<PushRegistryNotificationEntry, 'throttle'>): string =>
	entry.throttle ? `${entry.throttle.key} · ${entry.throttle.ttlSeconds}s` : '-';

export const formatEventChipLabel = (row: RegistryRow): string =>
	`${row.eventType} · ${row.entry.trigger.type === 'cron' ? '자동' : '이벤트'}`;

export const describeNotification = (row: RegistryRow): string => {
	const explicitDescription = EVENT_DESCRIPTIONS[row.eventType];
	if (explicitDescription) return explicitDescription;
	if (row.entry.trigger.type === 'cron') {
		return `${formatAudienceKo(row.entry)}에게 정해진 시간에 자동으로 보냅니다.`;
	}
	return `${formatCategoryName(row.entry.category)} 상황이 발생하면 ${formatAudienceKo(row.entry)}에게 보냅니다.`;
};

export const toReadableTemplateText = (text: string): string =>
	text.replaceAll('undefined', '{예시값}');

const includesText = (value: string, search: string): boolean =>
	value.toLowerCase().includes(search.toLowerCase());

export function filterRegistryRows(rows: RegistryRow[], filters: RegistryFilters): RegistryRow[] {
	return rows.filter(({ eventType, entry }) => {
		const text = [
			eventType,
			entry.category,
			formatCategoryName(entry.category),
			formatTrigger(entry),
			formatTriggerKo(entry),
			formatAudience(entry),
			formatAudienceKo(entry),
			entry.template.ko.title,
			entry.template.ko.body,
			entry.template.ja.title,
			entry.template.ja.body,
			entry.route,
			entry.deepLink ?? '',
			entry.requiredFields.join(' '),
			formatPersistence(entry),
			formatThrottle(entry),
		].join(' ');
		if (filters.search && !includesText(text, filters.search)) return false;
		if (filters.category !== 'all' && entry.category !== filters.category) return false;
		if (filters.eventType !== 'all' && eventType !== filters.eventType) return false;
		if (filters.trigger !== 'all' && entry.trigger.type !== filters.trigger) return false;
		if (filters.audience !== 'all' && entry.audience.type !== filters.audience) return false;
		if (filters.persistence === 'persisted' && !entry.persistence) return false;
		if (filters.persistence === 'none' && entry.persistence) return false;
		if (filters.throttle === 'enabled' && !entry.throttle) return false;
		if (filters.throttle === 'disabled' && entry.throttle) return false;
		if (filters.suppressInRoom === 'true' && !entry.suppressInRoom) return false;
		if (filters.suppressInRoom === 'false' && entry.suppressInRoom) return false;
		return true;
	});
}
