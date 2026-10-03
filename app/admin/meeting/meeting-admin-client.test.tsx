import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminService from '@/app/services/admin';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import MeetingAdminClient from './meeting-admin-client';

jest.mock('@/app/services/admin', () => ({
	__esModule: true,
	default: { meeting: { listRooms: jest.fn(), listRefundFailures: jest.fn() } },
}));
jest.mock('./room-detail-drawer', () => ({ RoomDetailDrawer: () => null }));
jest.mock('./refund-failures-table', () => ({ RefundFailuresTable: () => null }));

const listRooms = AdminService.meeting.listRooms as jest.Mock;
const room = { id: 'room-1', status: 'CONFIRMED', hostGender: 'MALE', title: 'Guest result', scheduledAt: null, createdAt: null };

describe('Meeting participant search and paging', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(AdminService.meeting.listRefundFailures as jest.Mock).mockResolvedValue([]);
		listRooms.mockResolvedValue({ rooms: [room], nextCursor: 'next-50' });
	});

	it('submits participant search to the server and uses next and previous cursors', async () => {
		render(<MeetingAdminClient />);
		await screen.findByTestId('meeting-room-row-room-1');
		fireEvent.change(screen.getByRole('textbox'), { target: { value: ' guest-user-7 ' } });
		fireEvent.click(screen.getByRole('button', { name: '검색' }));
		await screen.findByTestId('meeting-room-row-room-1');
		expect(listRooms).toHaveBeenLastCalledWith({ query: 'guest-user-7', status: undefined, cursor: undefined });
		fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));
		await screen.findByTestId('meeting-room-row-room-1');
		expect(listRooms).toHaveBeenLastCalledWith({ query: 'guest-user-7', status: undefined, cursor: 'next-50' });
		fireEvent.click(screen.getByRole('button', { name: '이전 페이지' }));
		await screen.findByTestId('meeting-room-row-room-1');
		expect(listRooms).toHaveBeenLastCalledWith({ query: 'guest-user-7', status: undefined, cursor: undefined });
	}, 30000);

	it('shows an error when the rooms API returns 500', async () => {
		listRooms.mockRejectedValue(new AdminApiError('failure', 500));
		render(<MeetingAdminClient />);
		expect(await screen.findByText(/미팅 방 목록을 불러오지 못했어요/)).toBeVisible();
		expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();
	});
});
