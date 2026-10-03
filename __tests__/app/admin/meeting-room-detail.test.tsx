import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoomDetailDrawer } from '@/app/admin/meeting/room-detail-drawer';
import AdminService from '@/app/services/admin';
import type { MeetingRoomDetail } from '@/app/services/admin';

jest.mock('@/app/services/admin', () => ({
	__esModule: true,
	default: { meeting: { getRoom: jest.fn() } },
}));
jest.mock('@/shared/ui/admin/confirm-dialog', () => ({ useConfirm: () => jest.fn() }));
jest.mock('@/shared/ui/admin/toast', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn() }) }));

it('shows the last member money action with administrator and KST time', async () => {
	const detail: MeetingRoomDetail = {
		room: {
			id: 'room-1', hostUserId: 'user-1', hostTeamId: 'team-1', guestTeamId: null,
			placeName: null, placeId: null, lat: null, lng: null, placeRegionLabel: null,
			placeStatus: 'TBD', hostRegionCode: null, scheduledAt: '2026-10-03T09:00:00Z',
			title: 'Audit room', intro: null, viewCount: 0, heroPresetIndex: 0, status: 'CONFIRMED',
			entrySource: 'DIRECT', hostGender: 'MALE', capacityPerTeam: 2, expiresAt: null,
			depositDueAt: null, canceledReason: null, createdAt: '2026-10-01T00:00:00Z',
			updatedAt: null, deletedAt: null, lastAdminAction: null,
		},
		members: [{
			memberId: 'member-1', userId: 'user-1', name: 'Audit member', gender: 'MALE',
			teamId: 'team-1', side: 'HOST', leftAt: null, contactRestricted: false,
			lastAdminAction: { action: 'REFUND', adminId: 'admin-42', at: '2026-10-03T01:02:00Z' },
		}],
		deposits: [], checkins: [], cancelLogs: [],
	};
	(AdminService.meeting.getRoom as jest.MockedFunction<typeof AdminService.meeting.getRoom>).mockResolvedValue(detail);
	render(<RoomDetailDrawer roomId="room-1" onClose={jest.fn()} onChanged={jest.fn()} />);
	const action = await screen.findByText(/마지막 관리자 조치:/);
	expect(action).toHaveTextContent('REFUND');
	expect(action).toHaveTextContent('admin-42');
	expect(action).toHaveTextContent('10:02');
});
