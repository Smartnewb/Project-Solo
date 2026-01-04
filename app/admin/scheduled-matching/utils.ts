import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const DAY_NAMES: Record<string, string> = {
  '0': '일',
  '1': '월',
  '2': '화',
  '3': '수',
  '4': '목',
  '5': '금',
  '6': '토',
};

export function parseCronToHumanReadable(cronExpression: string): string {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return cronExpression;

  const [minute, hour, , , dayOfWeek] = parts;

  const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  if (dayOfWeek === '*') {
    return `매일 ${timeStr}`;
  }

  const days = dayOfWeek.split(',').map((d) => DAY_NAMES[d.trim()] || d).join(', ');
  return `매주 ${days} ${timeStr}`;
}

export function formatNextExecution(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'yyyy-MM-dd (EEE) HH:mm', { locale: ko });
  } catch {
    return dateStr;
  }
}

export function getTimeDiff(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const now = new Date();

    if (date < now) {
      return '지남';
    }

    return formatDistanceToNow(date, { locale: ko, addSuffix: true });
  } catch {
    return '';
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: ko });
  } catch {
    return dateStr;
  }
}

export function formatDuration(startStr: string, endStr: string | null): string {
  if (!endStr) return '진행 중';

  try {
    const start = parseISO(startStr);
    const end = parseISO(endStr);
    const diffMs = end.getTime() - start.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`;
    }
    return `${seconds}초`;
  } catch {
    return '-';
  }
}

export const CRON_PRESETS = [
  { label: '매일 자정', value: '0 0 * * *' },
  { label: '주 2회 (목, 일) 자정', value: '0 0 * * 4,0' },
  { label: '주 2회 (금, 일) 자정', value: '0 0 * * 5,0' },
  { label: '주 3회 (월, 수, 금) 자정', value: '0 0 * * 1,3,5' },
  { label: '매주 일요일 자정', value: '0 0 * * 0' },
];

export const TIMEZONE_OPTIONS = [
  { label: 'Asia/Seoul (KST)', value: 'Asia/Seoul' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
];
