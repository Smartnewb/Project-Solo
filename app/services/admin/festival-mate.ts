import { adminDelete, adminPatch, adminRequest, getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

export type FestivalCountry = 'kr' | 'jp';

/** Existing offline-event identity is the expansion boundary: never pin this to one festival. */
export interface FestivalEvent {
  id: string;
  name: string;
  /** Existing API stores the host school / venue here, not the applicant's university. */
  location: string;
  country: FestivalCountry;
  slug: string | null;
  startsAt: string;
  endsAt: string;
  previewFrom: string | null;
  applyOpensAt: string | null;
  hiddenAt: string | null;
}

export interface FestivalParticipant {
  userId: string;
  joinedAt: string;
  /** false: 메이트 신청(한 줄 소개)이 없다. 운영 철회 뒤에도 참가자 행은 남는다. 구 서버 응답에는 없다. */
  mateRegistered?: boolean;
}

export interface FestivalWithdrawResult {
  rejectedReceived: number;
  cancelledSent: number;
}

export interface FestivalApplicantProfile {
  userId: string;
  name: string;
  nickname?: string | null;
  gender: string | null;
  universityName: string | null;
  status: string;
  country: string;
  isSuspended: boolean;
  isTest: boolean;
  isFaker: boolean;
  images: { reviewStatus: string }[];
  // Current member detail API omits this. Missing != active; never infer withdrawal from approval/404.
  deletedAt?: string | null;
}

export interface FestivalApplicant extends FestivalParticipant {
  profile: FestivalApplicantProfile | null;
  error: string | null;
}

export const festivalMate = {
  async getEvents(country: FestivalCountry, signal?: AbortSignal): Promise<FestivalEvent[]> {
    const events = await adminRequest<FestivalEvent[]>('/admin/offline-events', { signal });
    // Backend list is global; participant/member endpoints use the country in the authenticated session.
    return events.filter((event) => event.country.toLowerCase() === country);
  },
  getParticipants(eventId: string, signal?: AbortSignal) {
    return adminRequest<FestivalParticipant[]>(`/admin/offline-events/${encodeURIComponent(eventId)}/participants`, { signal });
  },
  async getProfile(userId: string, country: FestivalCountry, signal?: AbortSignal) {
    const result = await adminRequest<{ data: FestivalApplicantProfile }>(`/admin/v2/users/${encodeURIComponent(userId)}`, { signal });
    if (result.data.userId !== userId || result.data.country.toLowerCase() !== country) {
      throw new Error('회원 ID 또는 국가가 일치하지 않습니다. 새로고침 후 다시 조회하세요.');
    }
    return result.data;
  },
  withdraw(eventId: string, userId: string) {
    return adminDelete<FestivalWithdrawResult>(`/admin/offline-events/${encodeURIComponent(eventId)}/mates/${encodeURIComponent(userId)}`);
  },
  updateEvent(eventId: string, values: Pick<FestivalEvent, 'name' | 'location'>) {
    // Do not change audiences, application windows or matching policy through a metadata editor.
    return adminPatch<FestivalEvent>(`/admin/offline-events/${encodeURIComponent(eventId)}`, { name: values.name, location: values.location });
  },
};

/** Four workers, preserving failed rows. An unavailable member must not disappear from registration totals. */
export async function loadFestivalApplicants(
  participants: FestivalParticipant[],
  load: (userId: string) => Promise<FestivalApplicantProfile>,
  signal?: AbortSignal,
): Promise<FestivalApplicant[]> {
  const results: FestivalApplicant[] = new Array(participants.length);
  const checkAbort = () => {
    if (signal?.aborted) throw signal.reason ?? new DOMException('조회 취소', 'AbortError');
  };
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, participants.length) }, async () => {
    while (next < participants.length) {
      checkAbort();
      const index = next++;
      const participant = participants[index];
      try {
        const profile = await load(participant.userId);
        results[index] = { ...participant, profile, error: null };
      } catch (error) {
        checkAbort();
        results[index] = { ...participant, profile: null, error: getAdminErrorMessage(error) };
      }
    }
  }));
  checkAbort();
  return results;
}
