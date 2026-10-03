import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import AdminService from '@/app/services/admin';
import MeetingAdminClient from '@/app/admin/meeting/meeting-admin-client';

jest.mock('@/app/services/admin', () => ({
	__esModule: true,
	default: { meeting: { listRooms: jest.fn(), listRefundFailures: jest.fn() } },
}));
jest.mock('@/app/admin/meeting/room-detail-drawer', () => ({ RoomDetailDrawer: () => null }));
jest.mock('@/shared/ui/admin/confirm-dialog', () => ({ useConfirm: () => jest.fn() }));
jest.mock('@/shared/ui/admin/toast', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn() }) }));

const listRooms = AdminService.meeting.listRooms as jest.MockedFunction<typeof AdminService.meeting.listRooms>;
const listFailures = AdminService.meeting.listRefundFailures as jest.MockedFunction<typeof AdminService.meeting.listRefundFailures>;

describe('MeetingAdminClient server search and paging', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		listRooms.mockResolvedValue({ rooms: [], nextCursor: null });
		listFailures.mockResolvedValue([]);
	});

	it('submits a participant query to the server, not on each keystroke', async () => {
		const user = userEvent.setup();
		render(<MeetingAdminClient />);
		await waitFor(() => expect(screen.getByRole('button', { name: '새로고침' })).toBeEnabled());
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'participant-user-id' } });
		expect(listRooms).toHaveBeenCalledTimes(1);
		await user.click(screen.getByRole('button', { name: '검색', exact: true }));
		await waitFor(() => expect(listRooms).toHaveBeenLastCalledWith({ query: 'participant-user-id', status: undefined, cursor: undefined }));
	});

	it('uses server cursors for next and previous pages and resets the page for a search', async () => {
		const user = userEvent.setup();
		listRooms.mockResolvedValue({ rooms: [], nextCursor: 'cursor-50' });
		render(<MeetingAdminClient />);
		await waitFor(() => expect(screen.getByRole('button', { name: '다음 페이지' })).toBeEnabled());
		expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();
		listRooms.mockResolvedValue({ rooms: [], nextCursor: null });
		await user.click(screen.getByRole('button', { name: '다음 페이지' }));
		await waitFor(() => expect(listRooms).toHaveBeenLastCalledWith({ query: undefined, status: undefined, cursor: 'cursor-50' }));
		await waitFor(() => expect(screen.getByRole('button', { name: '이전 페이지' })).toBeEnabled());
		expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();
		listRooms.mockResolvedValue({ rooms: [], nextCursor: 'cursor-50' });
		await user.click(screen.getByRole('button', { name: '이전 페이지' }));
		await waitFor(() => expect(screen.getByRole('button', { name: '다음 페이지' })).toBeEnabled());
		expect(listRooms).toHaveBeenLastCalledWith({ query: undefined, status: undefined, cursor: undefined });
		await user.click(screen.getByRole('button', { name: '다음 페이지' }));
		await waitFor(() => expect(screen.getByRole('button', { name: '이전 페이지' })).toBeEnabled());
		fireEvent.change(screen.getByRole('textbox'), { target: { value: '1234' } });
		await user.click(screen.getByRole('button', { name: '검색', exact: true }));
		await waitFor(() => expect(listRooms).toHaveBeenLastCalledWith({ query: '1234', status: undefined, cursor: undefined }));
		expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();
	});

	it('shows a server failure and prevents paging through stale results', async () => {
		listRooms.mockRejectedValue({ response: { status: 500 } });
		const { container } = render(<MeetingAdminClient />);
		await waitFor(() => expect(container.querySelector('[data-slot="alert-root"]')).toBeInTheDocument());
		expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();
	});
});
