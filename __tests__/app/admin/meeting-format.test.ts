import { meetingErrorMessage, MEETING_ERROR_MESSAGES } from '@/app/admin/meeting/lib/errors';
import { checkinSourceLabel, formatKrw, formatKst, roomRegionLabel } from '@/app/admin/meeting/lib/format';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';

describe('meeting admin format helpers', () => {
	it('formats KRW with thousands separators', () => {
		expect(formatKrw(30000)).toBe('30,000원');
		expect(formatKrw(1234567)).toBe('1,234,567원');
		expect(formatKrw(null)).toBe('-');
	});

	it('formats times in KST regardless of the process time zone', () => {
		expect(formatKst('2026-10-02T15:00:00.000Z')).toBe('2026-10-03 00:00');
		expect(formatKst(null)).toBe('-');
		expect(formatKst('not-a-date')).toBe('-');
	});

	it('tells peer-confirmed check-ins apart from GPS and operator check-ins', () => {
		// 상대 확인: GPS + 유효 + 거리 없음 (스키마 변경 없이 저장된 모양)
		expect(checkinSourceLabel({ method: 'GPS', isValid: true, distanceM: null })).toBe('상대 확인');
		expect(checkinSourceLabel({ method: 'GPS', isValid: true, distanceM: 23.4 })).toBe('GPS 23m');
		expect(checkinSourceLabel({ method: 'GPS', isValid: false, distanceM: null })).toBe('GPS -');
		expect(checkinSourceLabel({ method: 'MANUAL_ADMIN', isValid: true, distanceM: null })).toBe('운영자 확인');
	});

	it('prefers the place region and falls back to the host region code name', () => {
		expect(roomRegionLabel({ placeRegionLabel: '서울 마포구', hostRegionCode: 'SEL' })).toBe('서울 마포구');
		expect(roomRegionLabel({ placeRegionLabel: null, hostRegionCode: 'DJN' })).toBe('대전');
		expect(roomRegionLabel({ placeRegionLabel: null, hostRegionCode: 'XYZ' })).toBe('XYZ');
		expect(roomRegionLabel({ placeRegionLabel: null, hostRegionCode: null })).toBe('-');
	});
});

describe('meetingErrorMessage', () => {
	it('maps the contact-restricted 409 code instead of showing the bare status', () => {
		const error = new AdminApiError('Request failed: 409', 409, {
			error: '연락처 공유 제한이 적용된 멤버는 이 환불을 받을 수 없어요.',
			code: 'MEETING.CONFLICT_CONTACT_RESTRICTED',
			locale: 'ko',
		});

		expect(meetingErrorMessage(error, '실패')).toBe(MEETING_ERROR_MESSAGES['MEETING.CONFLICT_CONTACT_RESTRICTED']);
	});

	it('uses the translated server text for other AppException codes', () => {
		const error = new AdminApiError('Request failed: 409', 409, {
			error: '서버 문구',
			code: 'MEETING.SOMETHING_ELSE',
		});

		expect(meetingErrorMessage(error, '실패')).toBe('서버 문구');
	});

	it('does not leak 5xx details and keeps the fallback first', () => {
		const error = new AdminApiError('Internal server error', 500, { statusCode: 500, message: 'Internal server error' });

		expect(meetingErrorMessage(error, '미팅 취소에 실패했어요.').startsWith('미팅 취소에 실패했어요.')).toBe(true);
		expect(meetingErrorMessage(error, '미팅 취소에 실패했어요.')).not.toContain('Internal server error');
	});
});
