jest.mock('@/app/services/admin/users', () => ({ userAppearance: { getUserDetails: jest.fn() } }));
import { userAppearance } from '@/app/services/admin/users';
jest.mock('@/shared/lib/http/admin-fetch', () => ({
	adminGet: jest.fn(),
	adminPost: jest.fn(),
}));

import { meeting } from '@/app/services/admin/meeting';
import { adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

const mockedGet = adminGet as jest.Mock;
const mockedPost = adminPost as jest.Mock;

describe('meeting admin service', () => {
	beforeEach(() => jest.clearAllMocks());

	it('reads the room list, room detail and refund failures from admin/meeting', async () => {
		mockedGet.mockResolvedValue({ members: [] });

		await meeting.listRooms();
		await meeting.getRoom('room-1');
		await meeting.listRefundFailures();

		expect(mockedGet.mock.calls).toEqual([
			['/admin/meeting/rooms', {}],
			['/admin/meeting/rooms/room-1'],
			['/admin/meeting/refund-failures'],
		]);
	});

	it('enriches participants once per user and preserves the room when a profile fails', async () => {
		mockedGet.mockResolvedValue({ members: [
			{ memberId: 'm1', userId: 'u1', name: null },
			{ memberId: 'm2', userId: 'u1', name: null },
			{ memberId: 'm3', userId: 'u2', name: '기존 이름' },
		] });
		(userAppearance.getUserDetails as jest.Mock).mockImplementation(async (id: string) => {
			if (id === 'u2') throw new Error('unavailable');
			return { name: '참가자', appearanceGrade: 'A', age: 24, universityDetails: { name: '테스트대학교' }, profileImageUrl: '/photo.jpg' };
		});
		const detail = await meeting.getRoom('room-1');
		expect(userAppearance.getUserDetails).toHaveBeenCalledTimes(2);
		expect(detail.members[0]).toMatchObject({ name: '참가자', appearanceGrade: 'A', age: 24, universityName: '테스트대학교', profileImageUrl: '/photo.jpg' });
		expect(detail.members[2]).toMatchObject({ name: '기존 이름', profileUnavailable: true });
	});

	it('passes participant search, status and page cursor to the API', async () => {
		mockedGet.mockResolvedValue({ rooms: [], nextCursor: null });
		const params = { query: 'guest-user-7', status: 'CONFIRMED' as const, cursor: 'page-2' };
		await expect(meeting.listRooms(params)).resolves.toEqual({ rooms: [], nextCursor: null });
		expect(mockedGet).toHaveBeenCalledWith('/admin/meeting/rooms', params);
	});

	it('calls checkin with the userId and every other member command with the memberId', async () => {
		mockedPost.mockResolvedValue({});

		await meeting.manualCheckin('room-1', 'user-7');
		await meeting.refund('room-1', 'member-7');
		await meeting.refund('room-1', 'member-7', 'meeting-admin-refund');
		await meeting.forfeit('room-1', 'member-7');
		await meeting.forceMajeure('room-1', 'member-7', '진단서 확인');
		await meeting.forceMajeure('room-1', 'member-8');
		await meeting.clearContactFlag('room-1', 'member-7');
		await meeting.cancelRoom('room-1', '장소 사정');

		expect(mockedPost.mock.calls).toEqual([
			['/admin/meeting/rooms/room-1/members/user-7/checkin'],
			['/admin/meeting/rooms/room-1/members/member-7/refund', undefined],
			['/admin/meeting/rooms/room-1/members/member-7/refund', { reason: 'meeting-admin-refund' }],
			['/admin/meeting/rooms/room-1/members/member-7/forfeit'],
			['/admin/meeting/rooms/room-1/members/member-7/force-majeure', { note: '진단서 확인' }],
			['/admin/meeting/rooms/room-1/members/member-8/force-majeure', {}],
			['/admin/meeting/rooms/room-1/members/member-7/contact-flag/clear'],
			['/admin/meeting/rooms/room-1/cancel', { reason: '장소 사정' }],
		]);
	});

	it('encodes path segments', async () => {
		mockedPost.mockResolvedValue({});

		await meeting.forfeit('room/1', 'member?7');

		expect(mockedPost).toHaveBeenCalledWith('/admin/meeting/rooms/room%2F1/members/member%3F7/forfeit');
	});
});
