import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

/**
 * 2:2 미팅 운영 API (sometimes-api `admin/meeting/*`, 2026-10-01 확정 계약).
 * 서버 응답 모양이 바뀌면 이 파일만 고치면 된다. 응답은 감싸지 않은 원본 그대로 온다.
 */

export type MeetingRoomStatus =
	| 'OPEN'
	| 'RECRUITING'
	| 'MATCHED'
	| 'DEPOSIT_PENDING'
	| 'CONFIRMED'
	| 'IN_PROGRESS'
	| 'SETTLED'
	| 'EXPIRED'
	| 'PAYMENT_EXPIRED'
	| 'CANCELED';

export type MeetingGender = 'MALE' | 'FEMALE';
export type MeetingTeamSide = 'HOST' | 'GUEST';

export type MeetingDepositStatus =
	| 'PENDING_PAYMENT'
	| 'PAID_PENDING_SETTLEMENT'
	| 'SETTLING'
	| 'PARTIALLY_REFUNDED'
	| 'FULLY_REFUNDED'
	| 'FORFEITED'
	| 'PAYMENT_FAILED'
	| 'REFUND_FAILED';

/**
 * 체크인 방식. 상대 확인(peer) 체크인은 따로 값이 없고 GPS 로 저장된다(거리·오차 null).
 * 화면 구분은 app/admin/meeting/lib/format.ts 의 checkinSourceLabel 이 한다.
 */
export type MeetingCheckinMethod = 'GPS' | 'MANUAL_ADMIN';

/** 현재 쓰는 값. 예전 방에는 다른 값이 남아 있을 수 있어 `canceledReason` 은 string 으로 둔다. */
export type MeetingRoomCanceledReason = 'FREE_CANCEL' | 'COMPANY_CANCEL' | 'UNFILLED_VACANCY';

export interface MeetingAdminAction {
	action: string;
	adminId: string;
	at: string;
}

/** meeting_rooms 행. */
export interface MeetingRoomRow {
	lastAdminAction: MeetingAdminAction | null;
	id: string;
	hostUserId: string;
	hostTeamId: string;
	guestTeamId: string | null;
	placeName: string | null;
	placeId: string | null;
	lat: number | null;
	lng: number | null;
	placeRegionLabel: string | null;
	placeStatus: 'TBD' | 'CONFIRMED';
	hostRegionCode: string | null;
	scheduledAt: string;
	title: string | null;
	intro: string | null;
	viewCount: number;
	heroPresetIndex: number;
	status: MeetingRoomStatus;
	entrySource: string;
	hostGender: MeetingGender;
	capacityPerTeam: number;
	expiresAt: string | null;
	depositDueAt: string | null;
	canceledReason: string | null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
}

export interface MeetingRoomMember {
	lastAdminAction: MeetingAdminAction | null;
	memberId: string;
	userId: string;
	/** users.name (탈퇴 등으로 없으면 null). */
	name: string | null;
	gender: MeetingGender;
	teamId: string;
	side: MeetingTeamSide;
	leftAt: string | null;
	contactRestricted: boolean;
}

/** meeting_deposits 행. */
export interface MeetingRoomDeposit {
	id: string;
	roomId: string;
	memberId: string;
	paymentId: string | null;
	idempotencyKey: string;
	amount: number;
	refundedAmount: number;
	status: MeetingDepositStatus;
	paidAt: string | null;
	settledAt: string | null;
	lastError: string | null;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
}

/** meeting_checkins 행. 좌표(lat/lng)는 화면에 보여주지 않는다. */
export interface MeetingRoomCheckin {
	id: string;
	roomId: string;
	memberId: string;
	lat: number;
	lng: number;
	checkedAt: string;
	accuracyM: number | null;
	distanceM: number | null;
	mocked: boolean | null;
	isValid: boolean;
	method: MeetingCheckinMethod;
	createdAt: string;
	updatedAt: string | null;
	deletedAt: string | null;
}

/** meeting_cancel_logs 행. grade 는 'FREE' | 'RELEASE' (예전 행은 다른 값). */
export interface MeetingCancelLog {
	id: string;
	userId: string;
	roomId: string;
	grade: string;
	score: number;
	reason: string | null;
	exempt: boolean;
	exemptReason: string | null;
	createdAt: string;
}

/** `GET admin/meeting/rooms/:roomId` */
export interface MeetingRoomDetail {
	room: MeetingRoomRow;
	members: MeetingRoomMember[];
	deposits: MeetingRoomDeposit[];
	checkins: MeetingRoomCheckin[];
	cancelLogs: MeetingCancelLog[];
}

/**
 * `GET admin/meeting/refund-failures` — REFUND_FAILED, 또는 10분 넘게 SETTLING 에 멈춘 보증금.
 * SETTLING 은 결제사에서 실제 환불 여부를 먼저 확인해야 한다(바로 재시도하면 두 번 환불될 수 있음).
 */
export interface MeetingRefundFailure {
	refundedAmount: number;
	roomId: string;
	memberId: string;
	userId: string;
	status: Extract<MeetingDepositStatus, 'REFUND_FAILED' | 'SETTLING'>;
	amount: number;
	lastError: string | null;
	updatedAt: string | null;
}

export interface MeetingOkResult {
	ok: boolean;
}

export interface MeetingRefundResult {
	amount: number;
}

export interface MeetingContactFlagClearResult {
	count: number;
}

const BASE = '/admin/meeting';

const roomPath = (roomId: string) => `${BASE}/rooms/${encodeURIComponent(roomId)}`;
const memberPath = (roomId: string, memberKey: string) =>
	`${roomPath(roomId)}/members/${encodeURIComponent(memberKey)}`;

export const meeting = {
	listRooms: (params: { query?: string; status?: MeetingRoomStatus; cursor?: string } = {}): Promise<{ rooms: MeetingRoomRow[]; nextCursor: string | null }> =>
		adminGet<{ rooms: MeetingRoomRow[]; nextCursor: string | null }>(`${BASE}/rooms`, params),

	getRoom: (roomId: string): Promise<MeetingRoomDetail> => adminGet<MeetingRoomDetail>(roomPath(roomId)),

	/** 수동 체크인만 memberId 가 아니라 userId 를 받는다(기존 엔드포인트). */
	manualCheckin: (roomId: string, userId: string): Promise<MeetingRoomCheckin> =>
		adminPost<MeetingRoomCheckin>(`${memberPath(roomId, userId)}/checkin`),

	refund: (roomId: string, memberId: string, reason?: string): Promise<MeetingRefundResult> =>
		adminPost<MeetingRefundResult>(`${memberPath(roomId, memberId)}/refund`, reason ? { reason } : undefined),

	/** 응답 본문 없음. */
	forfeit: (roomId: string, memberId: string): Promise<void> =>
		adminPost<void>(`${memberPath(roomId, memberId)}/forfeit`),

	/** 연락처 제한 멤버면 409 `MEETING.CONFLICT_CONTACT_RESTRICTED`. */
	forceMajeure: (roomId: string, memberId: string, note?: string): Promise<MeetingOkResult> =>
		adminPost<MeetingOkResult>(`${memberPath(roomId, memberId)}/force-majeure`, note ? { note } : {}),

	clearContactFlag: (roomId: string, memberId: string): Promise<MeetingContactFlagClearResult> =>
		adminPost<MeetingContactFlagClearResult>(`${memberPath(roomId, memberId)}/contact-flag/clear`),

	/** reason 은 비어 있으면 안 된다. */
	cancelRoom: (roomId: string, reason: string): Promise<MeetingOkResult> =>
		adminPost<MeetingOkResult>(`${roomPath(roomId)}/cancel`, { reason }),

	listRefundFailures: (): Promise<MeetingRefundFailure[]> =>
		adminGet<MeetingRefundFailure[]>(`${BASE}/refund-failures`),
};
