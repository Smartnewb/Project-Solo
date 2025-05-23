/**
 * 날짜를 yyyy년 MM월 dd일 형식으로 포맷팅합니다.
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return '유효하지 않은 날짜';
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 시간을 hh:mm 형식으로 포맷팅합니다.
 */
export function formatTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return '유효하지 않은 시간';
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * 날짜와 시간을 yyyy년 MM월 dd일 hh:mm 형식으로 포맷팅합니다.
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return '유효하지 않은 날짜/시간';
  }

  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 날짜 문자열을 yyyy-MM-dd HH:mm 형식으로 포맷팅합니다.
 * 시간대 변환 없이 원본 문자열에서 날짜와 시간 부분만 추출합니다.
 */
export function formatDateTimeWithoutTimezoneConversion(dateString: string): string {
  if (!dateString) return '날짜 정보 없음';

  // ISO 형식 날짜 문자열에서 날짜와 시간 부분만 추출 (예: "2023-06-01T15:30:00.000Z")
  const match = dateString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (match) {
    const [_, date, time] = match;
    return `${date} ${time}`;
  }

  return dateString;
}

/**
 * 상대적 시간을 표시합니다 (예: "2분 전", "5일 전").
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return '유효하지 않은 날짜';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 30) {
    return `${diffDays}일 전`;
  } else if (diffMonths < 12) {
    return `${diffMonths}개월 전`;
  } else {
    return `${diffYears}년 전`;
  }
}

/**
 * 나이를 계산합니다 (생년월일로부터).
 */
export function calculateAge(birthDateString: string): number {
  const birthDate = new Date(birthDateString);

  if (isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * 날짜 문자열을 간단한 형식으로 포맷팅하는 함수
 * ISO 형식 날짜 문자열을 간결한 형식으로 변환
 *
 * @param dateString - ISO 형식의 날짜 문자열 (예: "2023-06-01T15:30:00Z")
 * @returns 포맷팅된 날짜 문자열 (예: "2023.06.01")
 */
export const formatSimpleDate = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '유효하지 않은 날짜';
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}.${month}.${day}`;
};

/**
 * 현재 시간과의 상대적 시간을 표시하는 함수
 *
 * @param dateString - ISO 형식의 날짜 문자열
 * @returns 상대적 시간 문자열 (예: "3일 전", "방금 전")
 */
export const formatRelativeTimeOld = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '유효하지 않은 날짜';
  }

  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '방금 전';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return formatSimpleDate(dateString);
  }
};