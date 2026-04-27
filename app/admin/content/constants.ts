export const CONTENT_TYPES = ['card-series', 'longform', 'article', 'notice'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'card-series': '카드시리즈',
  longform: '롱폼 아티클',
  article: '아티클',
  notice: '공지사항',
};

export const NEW_CATEGORY_OPTIONS = [
  { code: 'relationship', label: '연애' },
  { code: 'dating', label: '데이트' },
  { code: 'psychology', label: '심리' },
  { code: 'essay', label: '에세이' },
  { code: 'qna', label: '질의응답' },
  { code: 'event', label: '이벤트' },
] as const;

export const NEW_CATEGORY_CODES = NEW_CATEGORY_OPTIONS.map((o) => o.code) as readonly string[];

// Legacy (sometime-articles pre-migration). Keys must match DB values.
export const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  story: '스토리',
  interview: '인터뷰',
  tips: '팁',
  team: '팀 소개',
  update: '업데이트',
  safety: '안전 가이드',
};

export const NOTICE_CATEGORY_LABEL = '공지';
export const LEGACY_CATEGORY_SENTINEL = '__legacy__';
