import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import AdminService from '@/app/services/admin';
import { RefundFailuresTable } from '@/app/admin/meeting/refund-failures-table';
import type { MeetingRefundFailure } from '@/app/services/admin';

const mockConfirm = jest.fn();
const mockToast = { success: jest.fn(), error: jest.fn() };

jest.mock('@/shared/ui/admin/confirm-dialog', () => ({
	useConfirm: () => mockConfirm,
}));

jest.mock('@/shared/ui/admin/toast', () => ({
	useToast: () => mockToast,
}));

jest.mock('@/app/services/admin', () => ({
	__esModule: true,
	default: {
		meeting: {
			refund: jest.fn(),
		},
	},
}));

const mockedRefund = AdminService.meeting.refund as jest.MockedFunction<typeof AdminService.meeting.refund>;

const failed: MeetingRefundFailure = {
	roomId: 'room-1',
	memberId: 'member-failed',
	userId: 'user-1',
	status: 'REFUND_FAILED',
	amount: 10000,
	lastError: 'PG timeout',
	updatedAt: '2026-10-01T01:00:00.000Z',
};

const stuck: MeetingRefundFailure = {
	roomId: 'room-2',
	memberId: 'member-stuck',
	userId: 'user-2',
	status: 'SETTLING',
	amount: 30000,
	lastError: null,
	updatedAt: '2026-10-01T00:30:00.000Z',
};

function renderTable(onChanged = jest.fn()) {
	render(
		<RefundFailuresTable
			items={[failed, stuck]}
			loading={false}
			error={null}
			onDismissError={jest.fn()}
			onOpenRoom={jest.fn()}
			onChanged={onChanged}
		/>,
	);
	return { onChanged };
}

describe('RefundFailuresTable', () => {
	beforeEach(() => jest.clearAllMocks());

	it('offers retry only for REFUND_FAILED and never for stuck SETTLING rows', () => {
		renderTable();

		const failedRow = screen.getByTestId('refund-failure-row-room-1:member-failed');
		const stuckRow = screen.getByTestId('refund-failure-row-room-2:member-stuck');

		expect(within(failedRow).getByRole('button', { name: '환불 재시도' })).toBeEnabled();
		expect(within(stuckRow).queryByRole('button', { name: '환불 재시도' })).not.toBeInTheDocument();
		expect(within(stuckRow).getByText('결제사 확인 필요')).toBeInTheDocument();
	});

	it('does not refund when the operator backs out of the confirm', async () => {
		const user = userEvent.setup();
		mockConfirm.mockResolvedValue(false);
		const { onChanged } = renderTable();

		await user.click(screen.getByRole('button', { name: '환불 재시도' }));

		await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
		expect(mockedRefund).not.toHaveBeenCalled();
		expect(onChanged).not.toHaveBeenCalled();
	});

	it('retries the manual refund with the memberId after confirm and reloads the lists', async () => {
		const user = userEvent.setup();
		mockConfirm.mockResolvedValue(true);
		mockedRefund.mockResolvedValue({ amount: 10000 });
		const { onChanged } = renderTable();

		await user.click(screen.getByRole('button', { name: '환불 재시도' }));

		await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
		expect(mockedRefund).toHaveBeenCalledWith('room-1', 'member-failed');
		expect(mockToast.success).toHaveBeenCalledTimes(1);
	});
});
