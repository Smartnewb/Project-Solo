// openclaw 검수 질문셋 — 운영 support_chat_messages 실 유저 질문에서 추림.
// 출처: solo-nestjs-api/docs/openclaw/qa-question-set.md
// level: green=답변 가능(KB 근거) / yellow=부분(정책 수치 민감) / red=에스컬레이션 기대(개별 계정·장애)

export type GradeLevel = 'green' | 'yellow' | 'red';

export interface QaQuestion {
  id: number;
  category: string;
  text: string;
  level: GradeLevel;
  expected: string; // 정답 기준
}

export interface QaCategory {
  label: string;
  questions: QaQuestion[];
}

export const LEVEL_META: Record<GradeLevel, { label: string; emoji: string; color: string }> = {
  green: { label: '답변 가능', emoji: '🟢', color: '#16a34a' },
  yellow: { label: '부분(수치 민감)', emoji: '🟡', color: '#ca8a04' },
  red: { label: '에스컬레이션 기대', emoji: '🔴', color: '#dc2626' },
};

export const QA_CATEGORIES: QaCategory[] = [
  {
    label: '1. 사진 · 프로필 심사',
    questions: [
      { id: 1, category: '사진', text: '사진 업로드가 안돼요', level: 'red', expected: '개별 장애 가능 → 재시작·최신버전 안내 후 지속 시 에스컬레이션' },
      { id: 2, category: '사진', text: '프로필 사진이 왜 승인 거부 당했는지 모르겠습니다', level: 'yellow', expected: '심사 기준(본인·얼굴 식별·부적절 콘텐츠) 안내, 개별 사유는 어드민' },
      { id: 3, category: '사진', text: '사진이 거절되서 다시 업로드하고 싶은데 계속 거절당합니다', level: 'red', expected: '재업로드 실패=장애 신호 → 에스컬레이션' },
      { id: 4, category: '사진', text: '사진 재업로드가 계속 안 됩니다', level: 'red', expected: '에스컬레이션' },
      { id: 5, category: '사진', text: '아니 왜 사진 필수였다가 바뀜?', level: 'yellow', expected: '정책 변경 안내(허구 금지, 모르면 인정)' },
      { id: 6, category: '사진', text: '프로필 사진 변경해도 안됩니다', level: 'red', expected: '에스컬레이션' },
    ],
  },
  {
    label: '2. 구슬 · 결제',
    questions: [
      { id: 7, category: '구슬', text: '좋아요 받은 걸 수락하는데에도 구슬이 필요하나요?', level: 'green', expected: '수락은 무료(좋아요 전송 측만 차감)' },
      { id: 8, category: '구슬', text: '여자쪽에서 좋아요를 누르는것도 구슬이 필요한가', level: 'green', expected: '국내(KR) 여성 좋아요 무료(0)' },
      { id: 9, category: '구슬', text: '원래 코인이 13개 있었는데 왜 10개가 사라진거죠?', level: 'red', expected: '개별 차감 내역 → 에스컬레이션(허구 추측 금지)' },
      { id: 10, category: '구슬', text: '두 개 계속 누르다가 구슬이 다 사라졌다고 뜨는데 확인 부탁드립니다', level: 'red', expected: '개별 조사 → 에스컬레이션' },
      { id: 11, category: '구슬', text: '룰렛 돌려서 구슬 3개를 받았는데 안 들어옵니다', level: 'red', expected: '지급 누락 의심 → 에스컬레이션' },
      { id: 12, category: '구슬', text: '돌림판/룰렛은 종료된건가요?', level: 'yellow', expected: '기능 상태 — 모르면 인정, 허구 금지' },
    ],
  },
  {
    label: '3. 매칭',
    questions: [
      { id: 13, category: '매칭', text: '매칭 상대가 마음에 안 들면 어떻게 바꿔요?', level: 'green', expected: '카드 넘기기 / 재매칭(구슬) 안내' },
      { id: 14, category: '매칭', text: '무슨 요일 몇시에 매칭시켜주나요?', level: 'green', expected: '매칭 라운드 시간대 안내' },
      { id: 15, category: '매칭', text: '언제 매칭 받을 수 있어?', level: 'green', expected: '매칭 발급 주기 안내' },
      { id: 16, category: '매칭', text: '권역이나 지역은 학교에 따라 고정인가요?', level: 'green', expected: '권역=학교 기준 + 거주지 조정 정책' },
      { id: 17, category: '매칭', text: '지역이 학교 지역과 다른 곳에 거주중인데 거주 지역에서 매칭하고 싶어요', level: 'yellow', expected: '권역 정책 안내(변경 가능 여부)' },
      { id: 18, category: '매칭', text: '재매칭 하려면 구슬 얼마 들어요?', level: 'green', expected: '재매칭 40구슬 / 필터 재매칭 56구슬' },
    ],
  },
  {
    label: '4. 프로필 열람 · 개인정보',
    questions: [
      { id: 19, category: '열람', text: '매칭이 됐는데도 상대방 프로필을 못보는데', level: 'red', expected: '열람 장애 가능 → 에스컬레이션' },
      { id: 20, category: '열람', text: '내 프로필에 이름이랑 전화번호 학과까지 떠?', level: 'green', expected: '노출 정보 범위 안내(전번 비노출 등)' },
      { id: 21, category: '열람', text: '상대방 프로필 열람이 안 되고 관리자 문의하라고만 떠요', level: 'red', expected: '에스컬레이션' },
    ],
  },
  {
    label: '5. 한일(글로벌) 매칭',
    questions: [
      { id: 22, category: '글로벌', text: '한일 매칭이 사라져 있는데', level: 'yellow', expected: '글로벌 매칭 노출 조건 안내' },
      { id: 23, category: '글로벌', text: '일본 매칭 조건 설정하고 나가기가 안 됩니다', level: 'red', expected: 'UI 버그 가능 → 에스컬레이션' },
      { id: 24, category: '글로벌', text: '글로벌 좋아요는 구슬 얼마예요?', level: 'green', expected: 'KR 120 / JP 남 24·여 무료' },
    ],
  },
  {
    label: '6. 계정',
    questions: [
      { id: 25, category: '계정', text: '회원탈퇴 어떻게 해?', level: 'green', expected: '설정 내 탈퇴 경로 안내' },
      { id: 26, category: '계정', text: '나이 변경 어떻게 하나요 잘못 한 거 같아서요', level: 'yellow', expected: '변경 가능 여부/경로 — 불가 시 에스컬레이션' },
      { id: 27, category: '계정', text: '마지막 접속 "방금 전"은 몇 시간까지에요?', level: 'green', expected: '접속 표기 기준 안내' },
    ],
  },
  {
    label: '7. 채팅 · 좋아요',
    questions: [
      { id: 28, category: '채팅', text: '좋아요 보내면 구슬 몇 개 차감돼요?', level: 'green', expected: '남 24구슬 / 여 무료' },
      { id: 29, category: '채팅', text: '채팅방 여는 데 구슬 얼마 차감돼요?', level: 'green', expected: '남 16구슬 / 여 무료' },
      { id: 30, category: '채팅', text: '편지 좋아요는 구슬 얼마예요?', level: 'green', expected: '40구슬' },
    ],
  },
];

export const ALL_QUESTIONS: QaQuestion[] = QA_CATEGORIES.flatMap((c) => c.questions);
