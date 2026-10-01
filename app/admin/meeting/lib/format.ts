import { REGION_MAP } from '@/app/admin/sales/constants/regions';
import type {
	MeetingDepositStatus,
	MeetingGender,
	MeetingRoomCheckin,
	MeetingRoomRow,
	MeetingRoomStatus,
	MeetingTeamSide,
} from '@/app/services/admin/meeting';

type ChipColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

export const ROOM_STATUS_LABEL: Record<MeetingRoomStatus, string> = {
	OPEN: '팀 구성 중',
	RECRUITING: '상대 모집 중',
	MATCHED: '매칭됨',
	DEPOSIT_PENDING: '결제 대기',
	CONFIRMED: '확정',
	IN_PROGRESS: '진행 중',
	SETTLED: '정산 완료',
	EXPIRED: '만료',
	PAYMENT_EXPIRED: '결제 만료',
	CANCELED: '취소됨',
};

export const ROOM_STATUS_COLOR: Record<MeetingRoomStatus, ChipColor> = {
	OPEN: 'default',
	RECRUITING: 'info',
	MATCHED: 'info',
	DEPOSIT_PENDING: 'warning',
	CONFIRMED: 'success',
	IN_PROGRESS: 'success',
	SETTLED: 'default',
	EXPIRED: 'default',
	PAYMENT_EXPIRED: 'default',
	CANCELED: 'error',
};

export const ROOM_STATUS_ORDER: MeetingRoomStatus[] = [
	'OPEN',
	'RECRUITING',
	'MATCHED',
	'DEPOSIT_PENDING',
	'CONFIRMED',
	'IN_PROGRESS',
	'SETTLED',
	'EXPIRED',
	'PAYMENT_EXPIRED',
	'CANCELED',
];

/** 회사 사정 취소가 가능한 상태 (서버 ROOM_LIVE_STATUSES: 더 갈 상태가 남은 방). */
export const LIVE_ROOM_STATUSES: ReadonlySet<MeetingRoomStatus> = new Set([
	'OPEN',
	'RECRUITING',
	'MATCHED',
	'DEPOSIT_PENDING',
	'CONFIRMED',
	'IN_PROGRESS',
]);

/** 수동 체크인·불가항력 환불이 가능한 상태. */
export const CHECKIN_OPEN_STATUSES: ReadonlySet<MeetingRoomStatus> = new Set([
	'CONFIRMED',
	'IN_PROGRESS',
]);

export const DEPOSIT_STATUS_LABEL: Record<MeetingDepositStatus, string> = {
	PENDING_PAYMENT: '결제 전',
	PAID_PENDING_SETTLEMENT: '결제 완료',
	SETTLING: '정산 중',
	PARTIALLY_REFUNDED: '일부 환불',
	FULLY_REFUNDED: '전액 환불',
	FORFEITED: '몰수',
	PAYMENT_FAILED: '결제 실패',
	REFUND_FAILED: '환불 실패',
};

export const DEPOSIT_STATUS_COLOR: Record<MeetingDepositStatus, ChipColor> = {
	PENDING_PAYMENT: 'default',
	PAID_PENDING_SETTLEMENT: 'success',
	SETTLING: 'warning',
	PARTIALLY_REFUNDED: 'info',
	FULLY_REFUNDED: 'info',
	FORFEITED: 'error',
	PAYMENT_FAILED: 'error',
	REFUND_FAILED: 'error',
};

/** 수동 몰수는 결제 완료 또는 환불 실패 상태에서만 서버가 받는다. */
export const FORFEITABLE_DEPOSIT_STATUSES: ReadonlySet<MeetingDepositStatus> = new Set([
	'PAID_PENDING_SETTLEMENT',
	'REFUND_FAILED',
]);

/** 회사 사정 취소 때 서버가 환불하는 결제 상태 (finishCanceledRefunds 의 COMPANY_CANCEL 과 같게 유지). */
export const COMPANY_CANCEL_REFUND_STATUSES: ReadonlySet<MeetingDepositStatus> = new Set([
	'PAID_PENDING_SETTLEMENT',
	'REFUND_FAILED',
	'FORFEITED',
	'PARTIALLY_REFUNDED',
]);

export const GENDER_LABEL: Record<MeetingGender, string> = {
	MALE: '남',
	FEMALE: '여',
};

export const SIDE_LABEL: Record<MeetingTeamSide, string> = {
	HOST: '호스트',
	GUEST: '게스트',
};

const CANCEL_GRADE_LABEL: Record<string, string> = {
	FREE: '확정 전 취소',
	RELEASE: '자리 넘기기',
	SOFT: '일반 취소(이전 기준)',
	ABUSE: '반복 취소(이전 기준)',
	GHOST: '잠수(이전 기준)',
};

const CANCELED_REASON_LABEL: Record<string, string> = {
	FREE_CANCEL: '확정 전 취소',
	COMPANY_CANCEL: '회사 사정',
	UNFILLED_VACANCY: '빈자리 미충원',
};

export function roomStatusLabel(status: string | null | undefined): string {
	if (!status) return '-';
	return (ROOM_STATUS_LABEL as Record<string, string>)[status] ?? status;
}

export function roomStatusColor(status: string | null | undefined): ChipColor {
	if (!status) return 'default';
	return (ROOM_STATUS_COLOR as Record<string, ChipColor>)[status] ?? 'default';
}

export function depositStatusLabel(status: string | null | undefined): string {
	if (!status) return '-';
	return (DEPOSIT_STATUS_LABEL as Record<string, string>)[status] ?? status;
}

export function depositStatusColor(status: string | null | undefined): ChipColor {
	if (!status) return 'default';
	return (DEPOSIT_STATUS_COLOR as Record<string, ChipColor>)[status] ?? 'default';
}

type CheckinSource = Pick<MeetingRoomCheckin, 'method' | 'isValid' | 'distanceM'>;

/**
 * 상대 확인 체크인. DB 스키마를 바꾸지 않아서 따로 표시 값이 없고,
 * method 'GPS' + 유효 + 거리 없음(distanceM null) 으로 저장된다.
 */
export function isPeerConfirmedCheckin(checkin: CheckinSource): boolean {
	return checkin.method === 'GPS' && checkin.isValid && checkin.distanceM == null;
}

/** 체크인 방식 표시. 운영자 확인 · 상대 확인 · GPS(거리). */
export function checkinSourceLabel(checkin: CheckinSource): string {
	if (checkin.method === 'MANUAL_ADMIN') return '운영자 확인';
	if (isPeerConfirmedCheckin(checkin)) return '상대 확인';
	if (checkin.method === 'GPS') return `GPS ${formatDistance(checkin.distanceM)}`;
	return String(checkin.method);
}

export function genderLabel(gender: string | null | undefined): string {
	if (!gender) return '-';
	return (GENDER_LABEL as Record<string, string>)[gender] ?? gender;
}

export function sideLabel(side: string | null | undefined): string {
	if (!side) return '-';
	return (SIDE_LABEL as Record<string, string>)[side] ?? side;
}

export function cancelGradeLabel(grade: string | null | undefined): string {
	if (!grade) return '-';
	return CANCEL_GRADE_LABEL[grade] ?? grade;
}

/** 예전 방에는 다른 값이 남아 있을 수 있어 모르는 값은 그대로 보여준다. */
export function canceledReasonLabel(reason: string | null | undefined): string {
	if (!reason) return '-';
	return CANCELED_REASON_LABEL[reason] ?? reason;
}

/** 장소 주소의 지역(예: 서울 마포구)을 먼저, 없으면 호스트 대학 지역 코드(예: DJN → 대전). */
export function roomRegionLabel(room: Pick<MeetingRoomRow, 'placeRegionLabel' | 'hostRegionCode'>): string {
	if (room.placeRegionLabel) return room.placeRegionLabel;
	if (room.hostRegionCode) return REGION_MAP[room.hostRegionCode] ?? room.hostRegionCode;
	return '-';
}

const KST_DATE_TIME = new Intl.DateTimeFormat('sv-SE', {
	timeZone: 'Asia/Seoul',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
});

/** ISO 문자열 → `YYYY-MM-DD HH:mm` (KST, 브라우저 시간대와 무관). 값이 없거나 깨졌으면 '-'. */
export function formatKst(value: string | null | undefined): string {
	if (!value) return '-';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '-';
	return KST_DATE_TIME.format(date);
}

/** 원화 금액. `30000` → `30,000원`. 숫자가 아니면 '-'. */
export function formatKrw(amount: number | null | undefined): string {
	if (typeof amount !== 'number' || !Number.isFinite(amount)) return '-';
	return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

/** 거리(m). 소수 없이 `12m`. 값이 없으면 '-'. */
export function formatDistance(distanceM: number | null | undefined): string {
	if (typeof distanceM !== 'number' || !Number.isFinite(distanceM)) return '-';
	return `${Math.round(distanceM).toLocaleString('ko-KR')}m`;
}

/** 긴 ID 를 표에 짧게 보여줄 때. UUIDv7 은 앞부분이 생성 시각이라 방끼리 거의 같아서, 무작위인 뒤 8자를 보여준다. */
export function shortId(id: string | null | undefined): string {
	if (!id) return '-';
	return id.length > 12 ? `…${id.slice(-8)}` : id;
}
