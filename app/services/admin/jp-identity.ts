import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

export type JpIdentityStatus = 'PENDING' | 'MANUAL_REVIEW' | 'APPROVED' | 'REJECTED';

export type JpIdentityGender = 'MALE' | 'FEMALE';

export interface JpIdentityExtracted {
	name: string | null;
	birthDate: string | null;
}

export interface JpIdentityAccount {
	name: string | null;
	birthday: string | null;
	age: number | null;
	gender: JpIdentityGender | null;
	userStatus: string | null;
}

export interface JpIdentityChecks {
	nameMatches: boolean | null;
	birthDateMatches: boolean | null;
	adultByDocument: boolean | null;
}

/** sometimes-api `admin/jp/identity` 응답 항목. jp 스키마 전용(x-country=jp). */
export interface JpIdentitySubmission {
	id: string;
	userId: string;
	/** DRIVERS_LICENSE | HEALTH_INSURANCE | MY_NUMBER | PASSPORT 등. 미지 값은 원문 그대로 노출. */
	documentType: string;
	status: JpIdentityStatus;
	submittedAt: string | null;
	reviewedAt: string | null;
	rejectionReason: string | null;
	/** presigned URL, 10분 뒤 만료 — 로드 실패 시 getById 로 재발급. */
	imageUrl: string | null;
	extracted: JpIdentityExtracted;
	account: JpIdentityAccount | null;
	checks: JpIdentityChecks;
}

export interface JpIdentityActionResponse {
	message: string;
	data: JpIdentitySubmission;
}

const BASE = '/admin/jp/identity';

export const jpIdentity = {
	/** PENDING + MANUAL_REVIEW, 최신순. */
	getPending: (): Promise<JpIdentitySubmission[]> =>
		adminGet<JpIdentitySubmission[]>(`${BASE}/pending`),
	getById: (id: string): Promise<JpIdentitySubmission> =>
		adminGet<JpIdentitySubmission>(`${BASE}/${id}`),
	approve: (id: string): Promise<JpIdentityActionResponse> =>
		adminPost<JpIdentityActionResponse>(`${BASE}/${id}/approve`),
	reject: (id: string, reason: string): Promise<JpIdentityActionResponse> =>
		adminPost<JpIdentityActionResponse>(`${BASE}/${id}/reject`, { reason }),
};
