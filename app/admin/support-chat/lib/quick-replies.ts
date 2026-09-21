import type { SupportDomain } from '@/app/types/support-chat';

export interface QuickReply {
  id: string;
  /** 'all' 이면 모든 도메인에 노출, 특정 도메인이면 해당 세션에서만 우선 노출 */
  domain: SupportDomain | 'all';
  title: string;
  content: string;
  /** 기본 제공 템플릿 여부 (삭제 불가) */
  builtin?: boolean;
}

/**
 * 답변 본문에서 치환 가능한 변수.
 * {nickname} → 사용자 닉네임. 값이 없으면 치환하지 않고 토큰을 그대로 둔다(임의 대체값 주입 금지).
 */
export interface QuickReplyContext {
  nickname?: string;
}

export const QUICK_REPLY_VARIABLES: { token: string; label: string }[] = [
  { token: '{nickname}', label: '닉네임' },
];

const STORAGE_KEY = 'support-chat:quick-replies:v1';

const BUILTIN_REPLIES: QuickReply[] = [
  {
    id: 'builtin-greeting',
    domain: 'all',
    title: '인사 / 확인 중',
    content: '안녕하세요, 썸타임 고객지원팀입니다. 문의 주신 내용 확인 중이니 잠시만 기다려 주세요.',
    builtin: true,
  },
  {
    id: 'builtin-need-info',
    domain: 'all',
    title: '추가 정보 요청',
    content:
      '정확한 확인을 위해 아래 정보를 알려주시면 빠르게 도와드리겠습니다.\n- 발생 일시:\n- 화면 캡처(가능하면):\n- 사용 중인 기기/버전:',
    builtin: true,
  },
  {
    id: 'builtin-payment-refund',
    domain: 'payment',
    title: '결제 환불 안내',
    content:
      '결제 관련 불편을 드려 죄송합니다. 결제 내역을 확인한 뒤 환불 절차를 안내드리겠습니다. 결제하신 수단과 대략적인 결제 시각을 알려주시면 더 빠르게 처리됩니다.',
    builtin: true,
  },
  {
    id: 'builtin-matching',
    domain: 'matching',
    title: '매칭 문의 확인',
    content:
      '매칭 관련 문의 확인했습니다. 매칭 상대와의 진행 상황을 점검하고 있으니 잠시만 기다려 주세요.',
    builtin: true,
  },
  {
    id: 'builtin-chat',
    domain: 'chat',
    title: '채팅 오류 확인',
    content:
      '채팅 이용에 불편을 드려 죄송합니다. 해당 채팅방 상태를 확인하고 있으니 잠시만 기다려 주세요. 앱을 완전히 종료한 뒤 다시 실행해 보시는 것도 도움이 됩니다.',
    builtin: true,
  },
  {
    id: 'builtin-account',
    domain: 'account',
    title: '계정 문의 확인',
    content:
      '계정 관련 문의 확인했습니다. 본인 확인을 위해 가입 시 사용하신 정보를 함께 알려주시면 빠르게 도와드리겠습니다.',
    builtin: true,
  },
  {
    id: 'builtin-closing',
    domain: 'all',
    title: '마무리 인사',
    content: '도움이 되었길 바랍니다. 추가로 궁금한 점이 있으면 언제든 다시 문의해 주세요. 좋은 하루 되세요!',
    builtin: true,
  },
];

function loadCustomReplies(): QuickReply[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QuickReply =>
        !!item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.content === 'string'
    );
  } catch {
    return [];
  }
}

function saveCustomReplies(replies: QuickReply[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(replies.filter((r) => !r.builtin)));
}

export function getQuickReplies(): QuickReply[] {
  return [...BUILTIN_REPLIES, ...loadCustomReplies()];
}

export function addQuickReply(input: { domain: SupportDomain | 'all'; title: string; content: string }): QuickReply[] {
  const custom = loadCustomReplies();
  const next: QuickReply = {
    id: `custom-${custom.length}-${input.title.slice(0, 8)}`,
    domain: input.domain,
    title: input.title.trim(),
    content: input.content.trim(),
  };
  const updated = [...custom, next];
  saveCustomReplies(updated);
  return getQuickReplies();
}

export function removeQuickReply(id: string): QuickReply[] {
  const custom = loadCustomReplies().filter((r) => r.id !== id);
  saveCustomReplies(custom);
  return getQuickReplies();
}

/**
 * 도메인 우선 정렬: 현재 세션 도메인 → all → 기타 도메인 순.
 */
export function sortRepliesForDomain(replies: QuickReply[], domain?: SupportDomain): QuickReply[] {
  return [...replies].sort((a, b) => {
    const rank = (r: QuickReply) => {
      if (domain && r.domain === domain) return 0;
      if (r.domain === 'all') return 1;
      return 2;
    };
    return rank(a) - rank(b);
  });
}

/**
 * 변수 토큰 치환. 값이 없는 토큰은 그대로 둔다(임의 대체값 주입 금지).
 */
export function applyQuickReplyVariables(content: string, ctx: QuickReplyContext): string {
  if (!ctx.nickname) return content;
  return content.replaceAll('{nickname}', ctx.nickname);
}
