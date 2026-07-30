/**
 * GemReferenceType → 어드민이 읽는 이름.
 *
 * 표시 전용이다. 값 계산·전송에는 절대 쓰지 않고, 화면에는 항상 원본 enum 키를 함께 띄운다.
 * 매핑이 없으면 지어내지 않고 enum 키를 그대로 노출한다 — 새 액션이 추가되면
 * "영문 키가 그대로 보이는" 상태가 화면에 드러나야 여기 추가된다.
 *
 * 문구는 앱에서 실제로 쓰는 표현을 따른다(썸메이트 = AI 컴패니언, 럭키 룰렛, 24시간 소개팅,
 * 픽셀 캠퍼스). 개발 용어를 그대로 쓰면 운영자가 어떤 기능인지 못 알아본다.
 * 지급·환급 항목은 어미로 방향을 드러내고, 차감(소모) 항목은 동작 그대로 쓴다.
 */
export const GEM_FEATURE_LABELS: Record<string, string> = {
	// ── 차감 (유저가 구슬을 쓰는 액션) ────────────────────
	PROFILE_OPEN: '프로필 열람',
	LIKE_PROFILE: '좋아요 보내기',
	LIKE_MESSAGE: '좋아요 + 메시지 보내기',
	LIKE_WITH_LETTER: '좋아요 + 편지 보내기',
	LETTER_LIKE: '편지 보내기',
	CHAT_START: '채팅 시작하기',
	REMATCHING: '다시 매칭받기',
	FILTERED_REMATCHING: '조건 지정해서 다시 매칭받기',
	OLD_REMATCHING: '다시 매칭받기 (구버전)',
	PREMIUM_FILTER: '프리미엄 필터 사용',
	OPEN_INSTAGRAM: '상대 인스타그램 보기',
	PROFILE_VIEWER_REVEAL: '내 프로필 본 사람 확인',
	PERSONALITY_VIEW: '상대 연애 성향 보기',
	MOMENT_REPORT_VIEW: '모먼트 리포트 열람',
	SELF_INTRODUCTION_POST: '24시간 소개팅 등록',
	COMMUNITY_CONTACT_REQUEST: '커뮤니티 쪽지 보내기',
	GLOBAL_MATCHING_LIKE: '해외 유저에게 좋아요',
	GLOBAL_MATCHING_EXPLORE: '해외 유저 다음 상대 보기',
	INCENTIVE_CAMPAIGN_LIKE: '캠페인 좋아요',
	LUCKY_CHANCE_ACCEPT: '럭키찬스 수락',
	MEETING_REVEAL: '2:2 미팅 상대 정보 공개',
	VOICE_CALL: '음성 통화 (랜덤)',
	VOICE_CALL_POST_MATCH: '음성 통화 (매칭 상대)',
	AI_CHAT_SESSION: 'AI 채팅 코칭',
	AI_COACHING_RECHARGE: 'AI 코칭 횟수 충전',
	AI_DEEP_COACHING: 'AI 심층 코칭',
	CONVERSATION_ANALYSIS_UNLOCK: '대화 분석 열어보기',
	CHAT_ANALYSIS_VIEW: '채팅 분석 리포트 열람',
	CHAT_TRANSLATION_RECHARGE: '채팅 번역 횟수 충전',
	PHOTO_ENHANCEMENT: '프로필 사진 보정',
	PHOTO_DIAGNOSIS: '프로필 사진 진단',
	AI_COMPANION_UNLOCK: '썸메이트 잠금 해제',
	AI_COMPANION_CHAT_TOKEN: '썸메이트 대화 사용량 (변동 과금)',
	AI_COMPANION_CUSTOM_CREATE: '썸메이트 직접 만들기',
	AI_COMPANION_PHOTO: '썸메이트 사진 받기',
	AI_COMPANION_REHEARSAL: '썸메이트 대화 연습',
	TAROT_DRAW: '타로 뽑기',
	TAROT_DEEP_DIVE: '타로 심층 해석',
	PIXEL_CAMPUS_UNLOCK: '픽셀 캠퍼스 잠금 해제',

	// ── 지급 (유저가 구슬을 받는 경로) ────────────────────
	PAYMENT: '구슬 구매 (결제)',
	WELCOME_REWARD: '가입 환영 지급',
	WELCOME_REWARD_EXPIRED: '환영 지급분 기간 만료 회수',
	INSTAGRAM_REGISTRATION: '인스타그램 등록 지급',
	REFERRAL_INVITER: '친구 초대 지급 (초대한 사람)',
	REFERRAL_INVITEE: '친구 초대 지급 (초대받은 사람)',
	UNIVERSITY_VERIFICATION: '대학 인증 지급',
	COMMUNITY_FIRST_POST: '커뮤니티 첫 글 지급',
	CARD_NEWS_READ: '카드뉴스 읽기 지급',
	ROULETTE: '럭키 룰렛 당첨 지급',
	COMEBACK_REWARD: '복귀 유저 지급',
	MOMENT_ANSWER: '모먼트 답변 지급',
	DAILY_ATTENDANCE: '출석 지급',
	INVITE_BONUS: '초대 보너스 지급',
	AD_REWARD: '광고 시청 지급',
	FEEDBACK_RESPONSE: '설문·피드백 응답 지급',
	MEETING_NOSHOW_COMPENSATION: '2:2 미팅 노쇼 보상 지급',
	STORE_REVIEW_REWARD: '스토어 리뷰 지급',
	EVERYTIME_PROMO_REWARD: '에브리타임 프로모션 지급',

	// ── 환급 (쓴 구슬을 되돌려주는 경로) ──────────────────
	CHAT_REFUND: '채팅 환급',
	LETTER_REFUND: '편지 환급',
	COMMUNITY_CONTACT_REFUND: '커뮤니티 쪽지 무응답 환급',
	PROFILE_VIEWER_REFUND: '내 프로필 본 사람 환급',
	PERSONALITY_VIEW_REFUND: '상대 연애 성향 환급',
	SELF_INTRODUCTION_REFUND: '24시간 소개팅 조회 0건 환급',
	MOMENT_REPORT_VIEW_REFUND: '모먼트 리포트 환급',
	REMATCHING_REFUND: '다시 매칭받기 환급',
	GLOBAL_MATCHING_REFUND: '해외 매칭 환급',
	LUCKY_CHANCE_ACCEPT_REFUND: '럭키찬스 환급',
	VOICE_CALL_REFUND: '음성 통화 (랜덤) 환급',
	VOICE_CALL_POST_MATCH_REFUND: '음성 통화 (매칭 상대) 환급',
	CHAT_ANALYSIS_VIEW_REFUND: '채팅 분석 리포트 환급',
	AI_DEEP_COACHING_REFUND: 'AI 심층 코칭 환급',
	AI_COMPANION_CUSTOM_CREATE_REFUND: '썸메이트 직접 만들기 환급',
	PHOTO_ENHANCEMENT_REFUND: '프로필 사진 보정 환급',
	PHOTO_DIAGNOSIS_REFUND: '프로필 사진 진단 환급',
	TAROT_DRAW_REFUND: '타로 뽑기 환급',
	TAROT_DEEP_DIVE_REFUND: '타로 심층 해석 환급',
	PIXEL_CAMPUS_UNLOCK_REFUND: '픽셀 캠퍼스 환급',
	APPLE_IAP_REFUND: 'Apple 결제 환불',

	// ── 관리자 조작 ───────────────────────────────────────
	ADMIN_GRANT: '관리자 개별 지급',
	ADMIN_BULK_GRANT: '관리자 일괄 지급',
	ADMIN_DEDUCT: '관리자 차감',
};

/** 라벨이 없으면 enum 키를 그대로 돌려준다. */
export function featureLabel(featureType: string): string {
	return GEM_FEATURE_LABELS[featureType] ?? featureType;
}

/** 드롭다운 한 줄용 — "한글명 (ENUM_KEY)". 라벨이 없으면 키만. */
export function featureOptionLabel(featureType: string): string {
	const label = GEM_FEATURE_LABELS[featureType];
	return label ? `${label} (${featureType})` : featureType;
}
