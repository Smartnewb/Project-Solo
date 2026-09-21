'use client';

import { Box, Chip, Typography } from '@mui/material';
import { featureLabel } from './feature-labels';

/**
 * 액션 이름. 한글 라벨을 크게, 원본 enum 키를 작게 함께 보여준다 —
 * 어드민은 한글로 찾고, 개발자·CS 는 로그의 enum 키로 대조한다.
 */
export function FeatureName({ featureType }: { featureType: string }) {
	const label = featureLabel(featureType);
	return (
		<Box>
			<Typography variant="body2" fontWeight={600}>
				{label}
			</Typography>
			{label !== featureType && (
				<Typography variant="caption" color="text.secondary" component="code">
					{featureType}
				</Typography>
			)}
		</Box>
	);
}

/** 서버가 요구하는 확인 플래그. 메시지로 판별한다 — 별도 에러코드가 없다. */
export function neededConfirm(message: string): 'confirmFree' | 'confirmLargeChange' | null {
	if (message.includes('confirmFree')) return 'confirmFree';
	if (message.includes('confirmLargeChange')) return 'confirmLargeChange';
	return null;
}

/** 액션 전체 목록 = 가격이 있는 것 + 아직 없는 것. 서버 enum 을 FE 에 복제하지 않는다. */
export function mergeFeatureTypes(
	prices: { featureType: string }[],
	missingFeatureTypes: string[],
): string[] {
	return Array.from(
		new Set([...prices.map((p) => p.featureType), ...missingFeatureTypes]),
	).sort();
}

export const COUNTRY_OPTIONS = [
	{ value: '', label: '전체 국가' },
	{ value: 'kr', label: '한국 (KR)' },
	{ value: 'jp', label: '일본 (JP)' },
];

export const GENDER_OPTIONS = [
	{ value: '', label: '전체 성별' },
	{ value: 'MALE', label: '남성' },
	{ value: 'FEMALE', label: '여성' },
];

function scopeLabel(countryCode: string | null, gender: string | null): string {
	const c = countryCode ? countryCode.toUpperCase() : '전체';
	const g = gender === 'MALE' ? '남성' : gender === 'FEMALE' ? '여성' : '전체';
	return `${c} / ${g}`;
}

/** 스코프가 구체적일수록 우선순위가 높다(4 → 1). 정렬·표시에 쓴다. */
export function scopeRank(countryCode: string | null, gender: string | null): number {
	if (countryCode && gender) return 1;
	if (countryCode) return 2;
	if (gender) return 3;
	return 4;
}

export function ScopeChip({
	countryCode,
	gender,
}: {
	countryCode: string | null;
	gender: string | null;
}) {
	const rank = scopeRank(countryCode, gender);
	return (
		<Chip
			size="small"
			variant="outlined"
			color={rank === 4 ? 'default' : 'primary'}
			label={scopeLabel(countryCode, gender)}
		/>
	);
}

/** datetime-local 입력값(로컬 시각) → ISO8601(UTC). 서버는 timestamptz 로 저장한다. */
export function localInputToIso(value: string): string {
	return new Date(value).toISOString();
}

export type DiscountStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'CANCELED';

export function discountStatus(
	discount: { startsAt: string; endsAt: string; canceledAt: string | null },
	now: Date = new Date(),
): DiscountStatus {
	if (discount.canceledAt) return 'CANCELED';
	const start = new Date(discount.startsAt);
	const end = new Date(discount.endsAt);
	// 반개구간 [startsAt, endsAt) — 서버 해석과 동일해야 화면과 실차감이 어긋나지 않는다.
	if (now < start) return 'SCHEDULED';
	if (now >= end) return 'EXPIRED';
	return 'ACTIVE';
}

const DISCOUNT_STATUS_META: Record<
	DiscountStatus,
	{ label: string; color: 'default' | 'success' | 'info' | 'warning' }
> = {
	SCHEDULED: { label: '예정', color: 'info' },
	ACTIVE: { label: '진행중', color: 'success' },
	EXPIRED: { label: '종료', color: 'default' },
	CANCELED: { label: '취소됨', color: 'warning' },
};

export function DiscountStatusChip({ status }: { status: DiscountStatus }) {
	const meta = DISCOUNT_STATUS_META[status];
	return <Chip size="small" label={meta.label} color={meta.color} />;
}
