import {
	discountStatus,
	mergeFeatureTypes,
	neededConfirm,
	scopeRank,
} from '@/app/admin/gems/pricing/components/shared';
import {
	GEM_FEATURE_LABELS,
	featureLabel,
	featureOptionLabel,
} from '@/app/admin/gems/pricing/components/feature-labels';

describe('discountStatus', () => {
	const base = { startsAt: '2026-08-01T00:00:00.000Z', endsAt: '2026-08-10T00:00:00.000Z' };

	it('반개구간 [startsAt, endsAt) — 시작 경계는 포함, 종료 경계는 배제', () => {
		expect(discountStatus({ ...base, canceledAt: null }, new Date(base.startsAt))).toBe('ACTIVE');
		expect(discountStatus({ ...base, canceledAt: null }, new Date(base.endsAt))).toBe('EXPIRED');
	});

	it('시작 전은 예정, 기간 중은 진행중', () => {
		expect(discountStatus({ ...base, canceledAt: null }, new Date('2026-07-31T23:59:59Z'))).toBe(
			'SCHEDULED',
		);
		expect(discountStatus({ ...base, canceledAt: null }, new Date('2026-08-05T00:00:00Z'))).toBe(
			'ACTIVE',
		);
	});

	it('취소된 할인은 기간과 무관하게 취소됨', () => {
		expect(
			discountStatus(
				{ ...base, canceledAt: '2026-08-02T00:00:00.000Z' },
				new Date('2026-08-05T00:00:00Z'),
			),
		).toBe('CANCELED');
	});
});

describe('scopeRank', () => {
	it('구체적인 스코프일수록 낮은 값(높은 우선순위)', () => {
		expect(scopeRank('kr', 'MALE')).toBe(1);
		expect(scopeRank('kr', null)).toBe(2);
		expect(scopeRank(null, 'MALE')).toBe(3);
		expect(scopeRank(null, null)).toBe(4);
	});
});

describe('mergeFeatureTypes', () => {
	it('가격이 있는 액션과 미설정 액션을 중복 없이 합쳐 정렬한다', () => {
		expect(
			mergeFeatureTypes(
				[{ featureType: 'CHAT_START' }, { featureType: 'CHAT_START' }, { featureType: 'PROFILE_OPEN' }],
				['LIKE_PROFILE', 'CHAT_START'],
			),
		).toEqual(['CHAT_START', 'LIKE_PROFILE', 'PROFILE_OPEN']);
	});
});

describe('액션 라벨', () => {
	it('라벨이 없는 액션은 지어내지 않고 enum 키를 그대로 노출한다', () => {
		expect(featureLabel('CHAT_START')).toBe('채팅 시작하기');
		expect(featureLabel('SOME_NEW_ACTION')).toBe('SOME_NEW_ACTION');
		expect(featureOptionLabel('SOME_NEW_ACTION')).toBe('SOME_NEW_ACTION');
		expect(featureOptionLabel('CHAT_START')).toBe('채팅 시작하기 (CHAT_START)');
	});

	it('같은 한글 라벨이 두 액션에 붙어 있지 않다 — 어드민이 구별할 수 없게 된다', () => {
		const labels = Object.values(GEM_FEATURE_LABELS);
		expect(new Set(labels).size).toBe(labels.length);
	});
});

describe('neededConfirm', () => {
	it('서버 메시지에서 요구하는 확인 플래그를 뽑는다', () => {
		expect(neededConfirm('confirmFree 를 함께 보내주세요.')).toBe('confirmFree');
		expect(neededConfirm('confirmLargeChange 를 함께 보내주세요.')).toBe('confirmLargeChange');
		expect(neededConfirm('다른 관리자가 먼저 수정했습니다.')).toBeNull();
	});
});
