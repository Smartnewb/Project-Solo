import type {
	JpIdentityGender,
	JpIdentityStatus,
	JpIdentitySubmission,
} from "@/app/services/admin";

export type JpIdentityCheckKey = keyof JpIdentitySubmission["checks"];

export type CheckBadge = {
	readonly label: "일치" | "불일치" | "확인 불가";
	readonly color: "success" | "error" | "default";
};

export type StatusChip = {
	readonly label: string;
	readonly color: "warning" | "info" | "success" | "error" | "default";
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
	DRIVERS_LICENSE: "운전면허증",
	HEALTH_INSURANCE: "건강보험증",
	MY_NUMBER: "마이넘버카드",
	PASSPORT: "여권",
};

const STATUS_CHIPS: Record<JpIdentityStatus, StatusChip> = {
	PENDING: { label: "대기", color: "warning" },
	MANUAL_REVIEW: { label: "수동 심사", color: "info" },
	APPROVED: { label: "승인", color: "success" },
	REJECTED: { label: "거절", color: "error" },
};

export const JP_IDENTITY_CHECKS: ReadonlyArray<{
	key: JpIdentityCheckKey;
	label: string;
}> = [
	{ key: "nameMatches", label: "이름" },
	{ key: "birthDateMatches", label: "생년월일" },
	{ key: "adultByDocument", label: "18세 이상" },
];

/** 백엔드 enum 값을 한국어로. 모르는 값은 원문 그대로 노출한다. */
export function formatJpDocumentType(
	documentType: string | null | undefined,
): string {
	if (!documentType) return "-";
	return DOCUMENT_TYPE_LABELS[documentType] ?? documentType;
}

export function getCheckBadge(value: boolean | null | undefined): CheckBadge {
	if (value === true) return { label: "일치", color: "success" };
	if (value === false) return { label: "불일치", color: "error" };
	return { label: "확인 불가", color: "default" };
}

export function getStatusChip(status: string): StatusChip {
	return (
		(STATUS_CHIPS as Record<string, StatusChip | undefined>)[status] ?? {
			label: status,
			color: "default",
		}
	);
}

export function isJpIdentityActionable(status: string): boolean {
	return status === "PENDING" || status === "MANUAL_REVIEW";
}

const KST_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
	timeZone: "Asia/Seoul",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

/** ISO 문자열을 KST `YYYY-MM-DD HH:mm` 로. 비어 있거나 파싱 불가면 '-'. */
export function formatKstDateTime(value: string | null | undefined): string {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return KST_FORMATTER.format(date);
}

const DATE_ONLY_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
	timeZone: "Asia/Seoul",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/**
 * 생년월일(날짜 전용 값)을 `YYYY-MM-DD` 로. `YYYY-MM-DD...` 형태면 시간대 변환 없이 앞부분만 쓰고,
 * 그 외 파싱 가능한 값은 KST 기준 날짜로 표기한다.
 */
export function formatBirthDate(value: string | null | undefined): string {
	if (!value) return "-";
	const match = DATE_ONLY_PATTERN.exec(value.trim());
	if (match) return match[1];
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return KST_DATE_FORMATTER.format(date);
}

export function formatAge(age: number | null | undefined): string {
	if (age == null || !Number.isFinite(age)) return "-";
	return `${age}세`;
}

export function formatGender(
	gender: JpIdentityGender | string | null | undefined,
): string {
	if (gender === "MALE") return "남성";
	if (gender === "FEMALE") return "여성";
	return gender ?? "-";
}

/** 나이와 성별을 한 줄로 (`27세 · 남성`). 둘 다 없으면 '-'. */
export function formatAgeGender(
	age: number | null | undefined,
	gender: JpIdentityGender | string | null | undefined,
): string {
	const ageText = formatAge(age);
	const genderText = formatGender(gender);
	if (ageText === "-" && genderText === "-") return "-";
	if (genderText === "-") return ageText;
	if (ageText === "-") return genderText;
	return `${ageText} · ${genderText}`;
}

/** 거절 사유 빠른 선택. 유저에게 전달될 수 있어 일본어(です・ます)로 둔다. 라벨은 관리자용 한국어. */
export const JP_IDENTITY_REJECT_PRESETS: ReadonlyArray<{
	label: string;
	reason: string;
}> = [
	{
		label: "이미지 불선명",
		reason:
			"画像が不鮮明で内容を確認できませんでした。明るい場所で撮り直して再提出してください。",
	},
	{
		label: "이름 불일치",
		reason:
			"本人確認書類の氏名が登録情報と一致しませんでした。登録情報をご確認のうえ再提出してください。",
	},
	{
		label: "생년월일 불일치",
		reason:
			"本人確認書類の生年月日が登録情報と一致しませんでした。登録情報をご確認のうえ再提出してください。",
	},
	{
		label: "18세 미만",
		reason:
			"本人確認書類の生年月日により、18歳未満の方はご利用いただけません。",
	},
	{
		label: "지원하지 않는 서류",
		reason:
			"提出いただいた書類は本人確認に使用できません。運転免許証または健康保険証を提出してください。",
	},
];
