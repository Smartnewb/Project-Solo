import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminService from '@/app/services/admin';
import { RoomDetailDrawer } from './room-detail-drawer';

jest.mock('@/app/services/admin', () => ({
	__esModule: true, default: { meeting: { getRoom: jest.fn() } },
}));
jest.mock('@/shared/ui/admin/confirm-dialog', () => ({ useConfirm: () => jest.fn() }));
jest.mock('@/shared/ui/admin/toast', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn() }) }));

it('shows the latest action, admin identity and KST timestamp with its member card', async () => {
	(AdminService.meeting.getRoom as jest.Mock).mockResolvedValue({
		room: { id: 'room-1', status: 'SETTLED', scheduledAt: null, createdAt: null },
		members: [{
			memberId: 'member-1', userId: 'guest-user-1', name: 'Guest', gender: 'FEMALE',
			teamId: 'guest-team', side: 'GUEST', leftAt: null, contactRestricted: false,
			lastAdminAction: { action: 'MANUAL_REFUND', adminId: 'admin-42', at: '2026-10-03T01:00:00Z' },
		}],
		deposits: [], checkins: [], cancelLogs: [],
	});
	render(<RoomDetailDrawer roomId="room-1" onClose={jest.fn()} onChanged={jest.fn()} />);
	expect(await screen.findByText(/MANUAL_REFUND/)).toHaveTextContent('admin-42');
	expect(screen.getByText(/MANUAL_REFUND/)).toHaveTextContent('2026-10-03 10:00');
	expect(screen.getByTestId('meeting-member-card-member-1')).toBeInTheDocument();
});
