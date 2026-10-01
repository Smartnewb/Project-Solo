import {
	JP_IDENTITY_CHECKS,
	formatAge,
	formatAgeGender,
	formatBirthDate,
	formatGender,
	formatJpDocumentType,
	formatKstDateTime,
	getCheckBadge,
	getStatusChip,
	isJpIdentityActionable,
} from '@/app/admin/jp-identity/utils';

describe('jp identity display helpers', () => {
	describe('formatJpDocumentType', () => {
		it('maps known backend enum values to Korean labels', () => {
			expect(formatJpDocumentType('DRIVERS_LICENSE')).toBe('운전면허증');
			expect(formatJpDocumentType('HEALTH_INSURANCE')).toBe('건강보험증');
			expect(formatJpDocumentType('MY_NUMBER')).toBe('마이넘버카드');
			expect(formatJpDocumentType('PASSPORT')).toBe('여권');
		});

		it('falls back to the raw value for unknown types and a dash for empty', () => {
			expect(formatJpDocumentType('RESIDENCE_CARD')).toBe('RESIDENCE_CARD');
			expect(formatJpDocumentType(null)).toBe('-');
			expect(formatJpDocumentType(undefined)).toBe('-');
			expect(formatJpDocumentType('')).toBe('-');
		});
	});

	describe('getCheckBadge', () => {
		it('maps true/false/null to 일치/불일치/확인 불가 with the matching chip color', () => {
			expect(getCheckBadge(true)).toEqual({ label: '일치', color: 'success' });
			expect(getCheckBadge(false)).toEqual({ label: '불일치', color: 'error' });
			expect(getCheckBadge(null)).toEqual({ label: '확인 불가', color: 'default' });
			expect(getCheckBadge(undefined)).toEqual({ label: '확인 불가', color: 'default' });
		});

		it('covers name, birth date and adult checks in display order', () => {
			expect(JP_IDENTITY_CHECKS.map((check) => check.key)).toEqual([
				'nameMatches',
				'birthDateMatches',
				'adultByDocument',
			]);
		});
	});

	describe('getStatusChip / isJpIdentityActionable', () => {
		it('labels every known status and keeps unknown statuses visible', () => {
			expect(getStatusChip('PENDING')).toEqual({ label: '대기', color: 'warning' });
			expect(getStatusChip('MANUAL_REVIEW')).toEqual({ label: '수동 심사', color: 'info' });
			expect(getStatusChip('APPROVED')).toEqual({ label: '승인', color: 'success' });
			expect(getStatusChip('REJECTED')).toEqual({ label: '거절', color: 'error' });
			expect(getStatusChip('SOMETHING_NEW')).toEqual({ label: 'SOMETHING_NEW', color: 'default' });
		});

		it('only allows actions on PENDING and MANUAL_REVIEW', () => {
			expect(isJpIdentityActionable('PENDING')).toBe(true);
			expect(isJpIdentityActionable('MANUAL_REVIEW')).toBe(true);
			expect(isJpIdentityActionable('APPROVED')).toBe(false);
			expect(isJpIdentityActionable('REJECTED')).toBe(false);
		});
	});

	describe('formatKstDateTime', () => {
		it('renders UTC instants in Asia/Seoul regardless of the host time zone', () => {
			// 2026-09-30T23:30Z == 2026-10-01 08:30 KST (crosses the date line vs UTC)
			expect(formatKstDateTime('2026-09-30T23:30:00.000Z')).toBe('2026-10-01 08:30');
			expect(formatKstDateTime('2026-10-01T15:05:00+09:00')).toBe('2026-10-01 15:05');
		});

		it('returns a dash for missing or unparsable values', () => {
			expect(formatKstDateTime(null)).toBe('-');
			expect(formatKstDateTime(undefined)).toBe('-');
			expect(formatKstDateTime('not-a-date')).toBe('-');
		});
	});

	describe('formatBirthDate', () => {
		it('keeps date-only strings as-is without time zone shifting', () => {
			expect(formatBirthDate('1999-05-01')).toBe('1999-05-01');
			expect(formatBirthDate('1999-05-01T00:00:00.000Z')).toBe('1999-05-01');
		});

		it('formats other parsable values in KST and passes unparsable text through', () => {
			expect(formatBirthDate('May 1, 1999 00:00:00 GMT+0900')).toBe('1999-05-01');
			expect(formatBirthDate('平成11年5月1日')).toBe('平成11年5月1日');
			expect(formatBirthDate(null)).toBe('-');
		});
	});

	describe('age and gender formatting', () => {
		it('formats age in Korean and gender labels, with dashes for missing data', () => {
			expect(formatAge(26)).toBe('26세');
			expect(formatAge(null)).toBe('-');
			expect(formatAge(Number.NaN)).toBe('-');
			expect(formatGender('MALE')).toBe('남성');
			expect(formatGender('FEMALE')).toBe('여성');
			expect(formatGender(null)).toBe('-');
		});

		it('combines age and gender into one line and drops missing parts', () => {
			expect(formatAgeGender(27, 'MALE')).toBe('27세 · 남성');
			expect(formatAgeGender(27, null)).toBe('27세');
			expect(formatAgeGender(null, 'FEMALE')).toBe('여성');
			expect(formatAgeGender(null, null)).toBe('-');
		});
	});
});
