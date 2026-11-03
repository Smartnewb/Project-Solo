import {
  festivalMate,
  loadFestivalApplicants,
  type FestivalApplicantProfile,
  type FestivalEvent,
} from '@/app/services/admin/festival-mate';
import { adminDelete, adminPatch, adminRequest } from '@/shared/lib/http/admin-fetch';

jest.mock('@/shared/lib/http/admin-fetch', () => ({
  ...jest.requireActual('@/shared/lib/http/admin-fetch'),
  adminRequest: jest.fn(),
  adminPatch: jest.fn(),
  adminDelete: jest.fn(),
}));

const request = jest.mocked(adminRequest);
const patch = jest.mocked(adminPatch);
const remove = jest.mocked(adminDelete);
const profile = (userId: string): FestivalApplicantProfile => ({
  userId, name: `회원 ${userId}`, gender: 'MALE', universityName: '소속 대학교',
  status: 'approved', country: 'kr', isSuspended: false, isTest: false,
  isFaker: false, images: [],
});
const participants = Array.from({ length: 9 }, (_, i) => ({ userId: `user-${i}`, joinedAt: `2026-10-0${i + 1}T00:00:00Z` }));

beforeEach(() => jest.clearAllMocks());

describe('festivalMate service', () => {
  it('filters the global event list to the selected authenticated country', async () => {
    const events = [
      { id: 'kr-event', country: 'KR', location: '개최 대학교' },
      { id: 'jp-event', country: 'jp', location: '日本大学' },
    ] as FestivalEvent[];
    request.mockResolvedValueOnce(events);
    const signal = new AbortController().signal;
    await expect(festivalMate.getEvents('kr', signal)).resolves.toEqual([events[0]]);
    expect(request).toHaveBeenCalledWith('/admin/offline-events', { signal });
  });

  it('encodes the selected event identity and forwards cancellation', async () => {
    request.mockResolvedValueOnce(participants);
    const signal = new AbortController().signal;
    await expect(festivalMate.getParticipants('festival/a ?#', signal)).resolves.toEqual(participants);
    expect(request).toHaveBeenCalledWith('/admin/offline-events/festival%2Fa%20%3F%23/participants', { signal });
  });

  it('unwraps a v2 member profile, validating identity and country', async () => {
    const member = { ...profile('user/a'), country: 'KR' };
    request.mockResolvedValueOnce({ data: member });
    const signal = new AbortController().signal;
    await expect(festivalMate.getProfile('user/a', 'kr', signal)).resolves.toEqual(member);
    expect(request).toHaveBeenCalledWith('/admin/v2/users/user%2Fa', { signal });
  });

  it.each([
    { ...profile('someone-else') },
    { ...profile('user-0'), country: 'jp' },
  ])('rejects a mismatched member identity or country: %j', async (member) => {
    request.mockResolvedValueOnce({ data: member });
    await expect(festivalMate.getProfile('user-0', 'kr')).rejects.toThrow('회원 ID 또는 국가가 일치하지 않습니다');
  });

  it('saves only festival metadata, preserving eligibility and application policy', async () => {
    const values = {
      name: '백련제 2026', location: '국립한밭대학교',
      audiences: [{ kind: 'COUNTRY' }], applyOpensAt: '2026-01-01T00:00:00Z',
    };
    patch.mockResolvedValueOnce({ id: 'event/a', ...values });
    await festivalMate.updateEvent('event/a', values);
    expect(patch).toHaveBeenCalledWith('/admin/offline-events/event%2Fa', {
      name: values.name, location: values.location,
    });
  });

  it('withdraws one applicant through the encoded event and user identity', async () => {
    remove.mockResolvedValue({ rejectedReceived: 2, cancelledSent: 0 });

    const result = await festivalMate.withdraw('event/a', 'user/1');

    expect(remove).toHaveBeenCalledWith('/admin/offline-events/event%2Fa/mates/user%2F1');
    expect(result).toEqual({ rejectedReceived: 2, cancelledSent: 0 });
  });

  it('propagates HTTP failures instead of converting the list to zero applicants', async () => {
    request.mockRejectedValueOnce(new Error('접근 권한 없음'));
    await expect(festivalMate.getParticipants('event')).rejects.toThrow('접근 권한 없음');
  });
});

describe('loadFestivalApplicants', () => {
  it('uses at most four in-flight requests and preserves input order, including failed rows', async () => {
    let active = 0;
    let maximum = 0;
    const load = jest.fn(async (userId: string) => {
      active++;
      maximum = Math.max(maximum, active);
      try {
        await new Promise<void>((resolve) => setTimeout(resolve, userId === 'user-0' ? 10 : 0));
        if (userId === 'user-2') throw new Error('회원 404');
        return profile(userId);
      } finally {
        active--;
      }
    });
    const result = await loadFestivalApplicants(participants, load);
    expect(maximum).toBe(4);
    expect(load).toHaveBeenCalledTimes(9);
    expect(result.map((row) => row.userId)).toEqual(participants.map((row) => row.userId));
    expect(result[2]).toEqual({ ...participants[2], profile: null, error: '회원 404' });
    expect(result[0].profile?.userId).toBe('user-0');
  });

  it('does not fetch member data for an empty registration list', async () => {
    const load = jest.fn();
    await expect(loadFestivalApplicants([], load)).resolves.toEqual([]);
    expect(load).not.toHaveBeenCalled();
  });

  it('does not infer withdrawal from a failed profile request', async () => {
    const rows = await loadFestivalApplicants(participants.slice(0, 1), async () => { throw new Error('404'); });
    expect(rows).toEqual([{ ...participants[0], profile: null, error: '404' }]);
  });

  it('stops scheduling remaining profiles when aborted', async () => {
    const controller = new AbortController();
    const finish: (() => void)[] = [];
    const load = jest.fn((userId: string) => new Promise<FestivalApplicantProfile>((resolve) => {
      finish.push(() => resolve(profile(userId)));
    }));
    const result = loadFestivalApplicants(participants, load, controller.signal);
    const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    finish.forEach((resolve) => resolve());
    await rejected;
    expect(load).toHaveBeenCalledTimes(4);
  });

  it('rejects an already aborted signal before making requests', async () => {
    const controller = new AbortController();
    controller.abort();
    const load = jest.fn();
    await expect(loadFestivalApplicants(participants, load, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(load).not.toHaveBeenCalled();
  });
});
