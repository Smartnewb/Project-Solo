import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

// X-Country 헤더는 BFF가 admin_session_meta 기반으로 고정 주입한다.
// 백엔드는 이 헤더를 "어드민 인증 스키마 판별"에만 사용하고,
// 실제 발송 대상 국가는 그룹의 countryScope / 요청 body 로 결정된다. (PRD §6)

export type CountryScope = 'kr' | 'jp' | 'both';
export type GroupType = 'static' | 'dynamic';
export type Gender = 'MALE' | 'FEMALE';

export interface GroupFilterCriteria {
  gender?: Gender;
  signupDateFrom?: string; // ISO8601
  signupDateTo?: string; // ISO8601
}

export interface StaticUserIds {
  kr?: string[];
  jp?: string[];
}

export interface PushTargetGroup {
  id: string;
  name: string;
  description: string | null;
  countryScope: CountryScope;
  type: GroupType;
  staticUserIdsKr: string[] | null;
  staticUserIdsJp: string[] | null;
  filterCriteria: GroupFilterCriteria | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  countryScope: CountryScope;
  type: GroupType;
  staticUserIds?: StaticUserIds;
  filterCriteria?: GroupFilterCriteria;
}

export interface GroupPreview {
  kr: number;
  jp: number;
  total: number;
}

export interface GroupMemberProfile {
  id: string;
  name: string;
  phoneNumber: string | null;
}

export interface GroupMembers {
  kr: GroupMemberProfile[];
  jp: GroupMemberProfile[];
}

export interface FilterUsersRequest {
  phoneNumber?: string;
  name?: string;
  gender?: Gender;
  universities?: string[];
  regions?: string[];
  ranks?: string[];
  isDormant?: boolean;
  hasPreferences?: boolean;
  page?: number;
  limit?: number;
}

export interface FilteredUser {
  id: string;
  name: string;
  gender: Gender;
  profileImageUrl: string | null;
  phoneNumber: string | null;
}

export interface FilterUsersResponse {
  users: FilteredUser[];
  totalCount: number;
  totalPages: number;
}

export interface CreateBroadcastScheduleRequest {
  // 국가별 문구는 대상 스코프에 필요한 국가만 전송 (kr 그룹이면 JP 문구 생략)
  krTitle?: string;
  krBody?: string;
  jpTitle?: string;
  jpBody?: string;
  deepLink?: string;
  scheduledAt: string; // ISO8601, 미래
  targetGroupId?: string;
}

export interface BroadcastSchedule {
  id: string;
  krTitle: string;
  krBody: string;
  jpTitle: string;
  jpBody: string;
  deepLink: string | null;
  targetGroupId: string | null;
  scheduledAt: string;
  status: 'scheduled' | 'sent' | 'failed';
  targetPreviewCount: number;
  sentCount: number;
  failedCount: number;
  createdBy: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleCreatedResult {
  id: string;
  scheduledAt: string;
  targetPreviewCount: number;
}

// 라벨/색상 맵 — 목록·상세·이력 화면 공용 (중복 정의 방지)
export const GROUP_TYPE_LABEL: Record<GroupType, string> = { static: '정적', dynamic: '동적' };
export const GROUP_TYPE_COLOR: Record<GroupType, 'primary' | 'info'> = {
  static: 'primary',
  dynamic: 'info',
};
export const COUNTRY_SCOPE_LABEL: Record<CountryScope, string> = {
  kr: 'KR',
  jp: 'JP',
  both: 'KR+JP',
};
export const BROADCAST_STATUS_LABEL: Record<BroadcastSchedule['status'], string> = {
  scheduled: '예약됨',
  sent: '발송완료',
  failed: '실패',
};
export const BROADCAST_STATUS_COLOR: Record<BroadcastSchedule['status'], 'info' | 'success' | 'error'> = {
  scheduled: 'info',
  sent: 'success',
  failed: 'error',
};

// 스코프 → 대상 국가 배열. 백엔드 countriesForGroup 과 동일 규칙 (KR/JP 분기 중복 방지).
export function countriesForScope(scope: CountryScope): Array<'kr' | 'jp'> {
  return scope === 'both' ? ['kr', 'jp'] : [scope];
}

const BASE = '/admin/v2/messaging';

export const pushGroups = {
  list: async (): Promise<PushTargetGroup[]> => {
    const res = await adminGet<{ data: PushTargetGroup[] }>(`${BASE}/push/groups`);
    return res.data ?? [];
  },

  get: async (id: string): Promise<PushTargetGroup> => {
    const res = await adminGet<{ data: PushTargetGroup }>(`${BASE}/push/groups/${id}`);
    return res.data;
  },

  create: async (body: CreateGroupRequest): Promise<PushTargetGroup> => {
    const res = await adminPost<{ data: PushTargetGroup }>(`${BASE}/push/groups`, body);
    return res.data;
  },

  // 백엔드 컨벤션상 수정도 POST (PATCH 아님)
  update: async (id: string, body: Partial<CreateGroupRequest>): Promise<PushTargetGroup> => {
    const res = await adminPost<{ data: PushTargetGroup }>(`${BASE}/push/groups/${id}`, body);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await adminPost(`${BASE}/push/groups/${id}/delete`, {});
  },

  preview: async (id: string): Promise<GroupPreview> => {
    const res = await adminGet<{ data: GroupPreview }>(`${BASE}/push/groups/${id}/preview`);
    return res.data;
  },

  members: async (id: string): Promise<GroupMembers> => {
    const res = await adminGet<{ data: GroupMembers }>(`${BASE}/push/groups/${id}/members`);
    return res.data ?? { kr: [], jp: [] };
  },

  filterUsers: async (body: FilterUsersRequest): Promise<FilterUsersResponse> => {
    const res = await adminPost<{ data: FilterUsersResponse }>(
      `${BASE}/push/filter-users`,
      { page: 1, limit: 20, ...body },
    );
    return res.data ?? { users: [], totalCount: 0, totalPages: 0 };
  },
};

export const pushBroadcast = {
  schedule: async (body: CreateBroadcastScheduleRequest): Promise<ScheduleCreatedResult> => {
    const res = await adminPost<{ data: ScheduleCreatedResult }>(
      `${BASE}/push/broadcast/schedule`,
      body,
    );
    return res.data;
  },

  test: async (body: {
    userId: string;
    country: 'kr' | 'jp';
    title: string;
    body: string;
    deepLink?: string;
  }): Promise<{ success: boolean }> => {
    const res = await adminPost<{ data: { success: boolean } }>(
      `${BASE}/push/broadcast/test`,
      body,
    );
    return res.data ?? { success: false };
  },

  listSchedules: async (): Promise<BroadcastSchedule[]> => {
    const res = await adminGet<{ data: BroadcastSchedule[] }>(`${BASE}/push/broadcast/schedule`);
    return res.data ?? [];
  },

  getSchedule: async (id: string): Promise<BroadcastSchedule> => {
    const res = await adminGet<{ data: BroadcastSchedule }>(
      `${BASE}/push/broadcast/schedule/${id}`,
    );
    return res.data;
  },
};
