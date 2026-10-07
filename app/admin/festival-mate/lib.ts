import type { FestivalApplicant, FestivalEvent } from '@/app/services/admin/festival-mate';

export function formatFestivalTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '날짜 확인 필요';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
}

export function festivalYear(event: FestivalEvent): string {
  const date = new Date(event.startsAt);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Seoul' }).format(date)
    : '연도 미상';
}

export function isTodayKst(value: string, now = new Date()): boolean {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
  return formatter.format(date) === formatter.format(now);
}

export function festivalPhase(event: FestivalEvent, now = Date.now()): string {
  const starts = new Date(event.startsAt).getTime();
  const ends = new Date(event.endsAt).getTime();
  const preview = new Date(event.previewFrom ?? event.startsAt).getTime();
  const apply = new Date(event.applyOpensAt ?? event.previewFrom ?? event.startsAt).getTime();
  const hidden = event.hiddenAt ? new Date(event.hiddenAt).getTime() : ends + 3 * 24 * 60 * 60 * 1000;
  if (![starts, ends, preview, apply, hidden].every(Number.isFinite)) return '일정 확인 필요';
  if (now < preview) return '공개 전';
  if (now < apply) return '사전 공개';
  if (now < starts) return '사전 신청';
  if (now < ends) return '진행 중';
  return now < hidden ? '마감 안내' : '종료';
}

export function approvalLabel(status?: string): string {
  return ({ approved: '승인', pending: '미승인', rejected: '반려' } as Record<string, string>)[status?.toLowerCase() ?? ''] ?? '확인 불가';
}

export function membershipLabel(row: FestivalApplicant): string {
  if (!row.profile) return '회원 조회 실패';
  if (row.profile.deletedAt) return '탈퇴';
  if (row.profile.isSuspended) return '이용 정지';
  return row.profile.deletedAt === null ? '활성' : '탈퇴 여부 미제공';
}

export interface ApplicantFilters {
  search: string;
  university: string;
  gender: string;
  approval: string;
  category: string;
}

export function filterApplicants(rows: FestivalApplicant[], filters: ApplicantFilters): FestivalApplicant[] {
  const search = filters.search.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    const profile = row.profile;
    if (search && ![row.userId, profile?.name, profile?.nickname, profile?.universityName].some((value) => value?.toLocaleLowerCase().includes(search))) return false;
    if (filters.university && (profile?.universityName ?? '') !== filters.university) return false;
    if (filters.gender && profile?.gender?.toUpperCase() !== filters.gender) return false;
    if (filters.approval && profile?.status?.toLowerCase() !== filters.approval) return false;
    if (filters.category === 'internal' && !profile?.isTest && !profile?.isFaker) return false;
    if (filters.category === 'real' && (!profile || profile.isTest || profile.isFaker)) return false;
    if (filters.category === 'failed' && profile) return false;
    if (filters.category === 'suspended' && !profile?.isSuspended) return false;
    return true;
  });
}

function csvCell(value: string): string {
  // Guard spreadsheet formulas even after leading whitespace / control characters.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function applicantsCsv(event: FestivalEvent, rows: FestivalApplicant[]): string {
  const records = [
    ['축제 ID', '축제', '개최 학교·장소', '연도', '회원 ID', '이름', '닉네임', '소속 학교', '성별', '신청 시각(KST)', '프로필 승인', '계정 확인', '테스트', '가상 유저', '조회 오류'],
    ...rows.map((row) => [event.id, event.name, event.location, festivalYear(event), row.userId,
      row.profile?.name ?? '', row.profile?.nickname ?? '', row.profile?.universityName ?? '',
      row.profile?.gender ?? '', formatFestivalTime(row.joinedAt), approvalLabel(row.profile?.status), membershipLabel(row),
      row.profile ? String(row.profile.isTest) : '확인 불가', row.profile ? String(row.profile.isFaker) : '확인 불가', row.error ?? '']),
  ];
  return '\uFEFF' + records.map((record) => record.map(csvCell).join(',')).join('\r\n');
}
