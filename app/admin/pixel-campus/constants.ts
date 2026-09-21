import type {
  PixelCampusAxis,
  PixelCampusEpisodeStatus,
} from '@/types/admin';

export const AXIS_OPTIONS: Array<{ value: PixelCampusAxis; label: string }> = [
  { value: 'initiative', label: '적극성' },
  { value: 'expression', label: '표현' },
  { value: 'planning', label: '계획' },
  { value: 'pace', label: '관계 속도' },
  { value: 'conflict', label: '갈등 대응' },
];

export const STATUS_TABS: Array<{ value: PixelCampusEpisodeStatus | 'all'; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '초안' },
  { value: 'in_review', label: '검수중' },
  { value: 'scheduled', label: '예약' },
  { value: 'published', label: '게시중' },
  { value: 'archived', label: '보관' },
];

export const STATUS_LABELS: Record<PixelCampusEpisodeStatus, string> = {
  draft: '초안',
  in_review: '검수중',
  scheduled: '예약',
  published: '게시중',
  archived: '보관',
};

export const DIRECTION_LABELS: Record<PixelCampusAxis, { negative: string; positive: string }> = {
  initiative: { negative: '기다림', positive: '다가감' },
  expression: { negative: '담백함', positive: '표현함' },
  planning: { negative: '즉흥', positive: '계획' },
  pace: { negative: '천천히', positive: '빠르게' },
  conflict: { negative: '회피', positive: '대화' },
};

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function nextNinePmLocal(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(21, 0, 0, 0);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}
