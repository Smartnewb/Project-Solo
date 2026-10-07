import type { FestivalApplicant, FestivalApplicantProfile, FestivalEvent } from '@/app/services/admin/festival-mate';
import {
  applicantsCsv, approvalLabel, festivalPhase, festivalYear, filterApplicants,
  formatFestivalTime, isTodayKst, membershipLabel, type ApplicantFilters,
} from './lib';

const event: FestivalEvent = {
  id: 'event-1', name: '백련제', location: '개최 대학교', country: 'kr', slug: 'festival-2026',
  previewFrom: '2026-10-01T00:00:00Z', applyOpensAt: '2026-10-02T00:00:00Z',
  startsAt: '2026-10-04T00:00:00Z', endsAt: '2026-10-06T00:00:00Z', hiddenAt: null,
};
function row(id: string, changes: Partial<FestivalApplicantProfile> = {}): FestivalApplicant {
  return {
    userId: id, joinedAt: '2026-10-04T15:30:00Z', error: null,
    profile: {
      userId: id, name: '민지', nickname: '힘센 여우', gender: 'FEMALE', universityName: '소속 대학교',
      status: 'approved', country: 'kr', isSuspended: false, isTest: false, isFaker: false, images: [], ...changes,
    },
  };
}
const filters: ApplicantFilters = { search: '', university: '', gender: '', approval: '', category: '' };

describe('festival dates and phase', () => {
  it('uses KST when deriving the festival year at a UTC year boundary', () => {
    expect(festivalYear({ ...event, startsAt: '2025-12-31T15:01:00Z' })).toBe('2026');
    expect(festivalYear({ ...event, startsAt: 'not-a-date' })).toBe('연도 미상');
  });

  it('formats times in KST and reports invalid dates explicitly', () => {
    const time = formatFestivalTime('2026-10-04T15:30:00Z');
    expect(time).toContain('2026. 10. 05.');
    expect(time).toContain('00:30');
    expect(formatFestivalTime('invalid')).toBe('날짜 확인 필요');
  });

  it('counts today by KST calendar day, not UTC calendar day', () => {
    const now = new Date('2026-10-05T01:00:00Z');
    expect(isTodayKst('2026-10-04T15:00:00Z', now)).toBe(true);
    expect(isTodayKst('2026-10-04T14:59:59Z', now)).toBe(false);
    expect(isTodayKst('invalid', now)).toBe(false);
  });

  it.each([
    ['2026-09-30T23:59:59Z', '공개 전'],
    ['2026-10-01T00:00:00Z', '사전 공개'],
    ['2026-10-02T00:00:00Z', '사전 신청'],
    ['2026-10-04T00:00:00Z', '진행 중'],
    ['2026-10-06T00:00:00Z', '마감 안내'],
    ['2026-10-09T00:00:00Z', '종료'],
  ])('mirrors backend phase boundaries at %s', (now, expected) => {
    expect(festivalPhase(event, Date.parse(now))).toBe(expected);
  });

  it('uses startsAt when preview/application windows are omitted', () => {
    const legacy = { ...event, previewFrom: null, applyOpensAt: null };
    expect(festivalPhase(legacy, Date.parse('2026-10-03T00:00:00Z'))).toBe('공개 전');
    expect(festivalPhase(legacy, Date.parse(legacy.startsAt))).toBe('진행 중');
  });

  it('uses an explicit hide date and exposes invalid dates as unknown', () => {
    expect(festivalPhase({ ...event, hiddenAt: '2026-10-07T00:00:00Z' }, Date.parse('2026-10-07T00:00:00Z'))).toBe('종료');
    expect(festivalPhase({ ...event, startsAt: 'invalid' })).toBe('일정 확인 필요');
  });
});

describe('member labels and filters', () => {
  const failed: FestivalApplicant = { userId: 'missing', joinedAt: event.startsAt, profile: null, error: '404' };
  it('never treats approval or a 404 as proof of active membership or withdrawal', () => {
    expect(membershipLabel(row('approved'))).toBe('탈퇴 여부 미제공');
    expect(membershipLabel(row('pending', { status: 'pending' }))).toBe('탈퇴 여부 미제공');
    expect(membershipLabel(failed)).toBe('회원 조회 실패');
    expect(membershipLabel(row('explicit-active', { deletedAt: null }))).toBe('활성');
    expect(membershipLabel(row('withdrawn', { deletedAt: event.startsAt }))).toBe('탈퇴');
    expect(membershipLabel(row('suspended', { isSuspended: true }))).toBe('이용 정지');
  });

  it('keeps profile approval labels separate from account state', () => {
    expect(approvalLabel('APPROVED')).toBe('승인');
    expect(approvalLabel('pending')).toBe('미승인');
    expect(approvalLabel('rejected')).toBe('반려');
    expect(approvalLabel('withdrawn')).toBe('확인 불가');
    expect(approvalLabel()).toBe('확인 불가');
  });

  it('searches identity, name, nickname, and applicant school, case-insensitively', () => {
    const applicant = row('USER-Abc');
    for (const search of [' user-abc ', '민지', '힘센', '소속']) {
      expect(filterApplicants([applicant], { ...filters, search })).toEqual([applicant]);
    }
    expect(filterApplicants([applicant], { ...filters, search: event.location })).toEqual([]);
    expect(filterApplicants([failed], { ...filters, search: 'missing' })).toEqual([failed]);
  });

  it('combines school, gender and approval filters without inferring unavailable values', () => {
    const applicant = row('one', { gender: 'female', status: 'APPROVED' });
    const combined = { ...filters, university: '소속 대학교', gender: 'FEMALE', approval: 'approved' };
    expect(filterApplicants([applicant, row('other', { universityName: '다른 학교' }), failed], combined)).toEqual([applicant]);
  });

  it('separates internal accounts, real profiles, query failures, and suspension', () => {
    const real = row('real');
    const internal = row('test', { isTest: true });
    const fake = row('faker', { isFaker: true });
    const suspended = row('suspended', { isSuspended: true });
    const all = [real, internal, fake, suspended, failed];
    expect(filterApplicants(all, { ...filters, category: 'internal' })).toEqual([internal, fake]);
    expect(filterApplicants(all, { ...filters, category: 'real' })).toEqual([real, suspended]);
    expect(filterApplicants(all, { ...filters, category: 'failed' })).toEqual([failed]);
    expect(filterApplicants(all, { ...filters, category: 'suspended' })).toEqual([suspended]);
  });
});

describe('applicantsCsv', () => {
  it('includes a BOM, CRLF records, and separate host/applicant schools', () => {
    const csv = applicantsCsv(event, [row('one')]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.split('\r\n')).toHaveLength(2);
    expect(csv).toContain('"개최 학교·장소"');
    expect(csv).toContain('"소속 학교"');
    expect(csv).toContain('"개최 대학교"');
    expect(csv).toContain('"소속 대학교"');
    expect(csv).toContain('"탈퇴 여부 미제공"');
  });

  it.each(['=HYPERLINK("bad")', '+1+2', '-2+3', '@SUM(A1)', '  =SUM(A1)', '\t=SUM(A1)', '\u0001+SUM(A1)'])('neutralizes spreadsheet formula: %j', (value) => {
    const csv = applicantsCsv(event, [row('one', { name: value })]);
    expect(csv).toContain(`"'${value.replace(/"/g, '""')}"`);
  });

  it('escapes embedded double quotes while preserving commas and newlines inside quoted cells', () => {
    const csv = applicantsCsv(event, [row('one', { name: '민지, "별명"\n두 번째 줄' })]);
    expect(csv).toContain('"민지, ""별명""\n두 번째 줄"');
  });

  it('retains failed applicants and exposes unverified flags instead of false', () => {
    const csv = applicantsCsv(event, [{ userId: 'missing', joinedAt: event.startsAt, profile: null, error: '회원 조회 실패' }]);
    expect(csv).toContain('"missing"');
    expect(csv).toContain('"회원 조회 실패"');
    expect(csv).toContain('"확인 불가","확인 불가"');
    expect(csv).not.toContain('"활성"');
  });
});
