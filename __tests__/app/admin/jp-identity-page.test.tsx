import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import JpIdentityReviewPage from '@/app/admin/jp-identity/page';
import { jpIdentity } from '@/app/services/admin';
import type { JpIdentitySubmission } from '@/app/services/admin';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import { ConfirmDialog, ConfirmDialogProvider } from '@/shared/ui/admin/confirm-dialog';

let mockSelectedCountry = 'jp';
const mockChangeCountry = jest.fn();
const mockToast = {
	success: jest.fn(),
	error: jest.fn(),
	warning: jest.fn(),
	info: jest.fn(),
};

jest.mock('@/shared/ui/admin/toast', () => ({
	useToast: () => mockToast,
}));

jest.mock('@/shared/contexts/admin-session-context', () => ({
	useAdminSession: () => ({
		session: {
			user: { id: 'admin-1', email: 'admin@example.com', roles: ['admin'] },
			selectedCountry: mockSelectedCountry,
			issuedAt: 0,
		},
		isLoading: false,
		error: null,
		changeCountry: mockChangeCountry,
		logout: jest.fn(),
	}),
}));

jest.mock('@/app/services/admin', () => ({
	__esModule: true,
	jpIdentity: {
		getPending: jest.fn(),
		getById: jest.fn(),
		approve: jest.fn(),
		reject: jest.fn(),
	},
}));

const mocked = jpIdentity as jest.Mocked<typeof jpIdentity>;

const baseItem: JpIdentitySubmission = {
	id: 'sub-1',
	userId: 'user-1',
	documentType: 'DRIVERS_LICENSE',
	status: 'PENDING',
	submittedAt: '2026-09-30T23:30:00.000Z',
	reviewedAt: null,
	rejectionReason: null,
	imageUrl: 'https://s3.example.com/id-1.jpg?X-Amz-Expires=600',
	extracted: { name: '山田 太郎', birthDate: '1999-05-01' },
	account: { name: '山田 太郎', birthday: '1999-05-01', age: 27, gender: 'MALE', userStatus: 'ACTIVE' },
	checks: { nameMatches: true, birthDateMatches: false, adultByDocument: null },
};

const manualItem: JpIdentitySubmission = {
	...baseItem,
	id: 'sub-2',
	userId: 'user-2',
	documentType: 'RESIDENCE_CARD',
	status: 'MANUAL_REVIEW',
	submittedAt: '2026-09-29T03:00:00.000Z',
	imageUrl: null,
	extracted: { name: null, birthDate: null },
	account: null,
	checks: { nameMatches: null, birthDateMatches: null, adultByDocument: true },
};

function renderPage() {
	return render(
		<ConfirmDialogProvider>
			<ConfirmDialog />
			<JpIdentityReviewPage />
		</ConfirmDialogProvider>,
	);
}

describe('JpIdentityReviewPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSelectedCountry = 'jp';
		mocked.getPending.mockResolvedValue([baseItem, manualItem]);
		mocked.getById.mockResolvedValue({ ...baseItem, imageUrl: 'https://s3.example.com/id-1.jpg?fresh=1' });
		mocked.approve.mockResolvedValue({ message: '承認しました。', data: { ...baseItem, status: 'APPROVED' } });
		mocked.reject.mockResolvedValue({ message: '却下しました。', data: { ...baseItem, status: 'REJECTED' } });
	});

	it('shows the country notice and does not fetch when the selected country is not JP', async () => {
		mockSelectedCountry = 'kr';
		renderPage();

		expect(await screen.findByText('일본(JP)으로 국가를 전환한 뒤 이용하세요')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '국가 전환' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: '승인' })).not.toBeInTheDocument();
		expect(mocked.getPending).not.toHaveBeenCalled();
	});

	it('renders pending items with KST time, Korean document type, comparison and check badges', async () => {
		renderPage();

		expect(await screen.findByRole('heading', { level: 1, name: '일본 신분증 심사' })).toBeInTheDocument();
		const cards = await screen.findAllByTestId('jp-identity-card');
		expect(cards).toHaveLength(2);

		const first = within(cards[0]);
		expect(first.getByText('운전면허증 · 제출 2026-10-01 08:30 (KST)')).toBeInTheDocument();
		expect(first.getByText('대기')).toBeInTheDocument();
		expect(first.getAllByText('山田 太郎').length).toBeGreaterThanOrEqual(2);
		expect(first.getAllByText('1999-05-01')).toHaveLength(2);
		expect(first.getByText('27세 · 남성')).toBeInTheDocument();
		expect(first.getByText('이름 일치')).toBeInTheDocument();
		expect(first.getByText('생년월일 불일치')).toBeInTheDocument();
		expect(first.getByText('18세 이상 확인 불가')).toBeInTheDocument();
		expect(first.getByAltText('山田 太郎 운전면허증 이미지')).toHaveAttribute('src', baseItem.imageUrl);

		const second = within(cards[1]);
		expect(second.getByText(/RESIDENCE_CARD · 제출 2026-09-29 12:00 \(KST\)/)).toBeInTheDocument();
		expect(second.getByText('수동 심사')).toBeInTheDocument();
		expect(second.getByText('이미지 없음')).toBeInTheDocument();
		expect(second.getByText('연결된 계정 정보를 찾지 못했습니다.')).toBeInTheDocument();
		expect(second.getByText('18세 이상 일치')).toBeInTheDocument();
	});

	it('opens the enlarged image on click and refetches the item when the image fails to load', async () => {
		const user = userEvent.setup();
		renderPage();

		const cards = await screen.findAllByTestId('jp-identity-card');
		await user.click(within(cards[0]).getByRole('button', { name: '山田 太郎 신분증 크게 보기' }));
		expect(await screen.findByAltText('山田 太郎 운전면허증 이미지 크게 보기')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: '큰 이미지 닫기' }));
		await waitFor(() => {
			expect(screen.queryByAltText('山田 太郎 운전면허증 이미지 크게 보기')).not.toBeInTheDocument();
		});

		fireEvent.error(within(cards[0]).getByAltText('山田 太郎 운전면허증 이미지'));

		await waitFor(() => expect(mocked.getById).toHaveBeenCalledWith('sub-1'));
		await waitFor(() => {
			expect(within(cards[0]).getByAltText('山田 太郎 운전면허증 이미지')).toHaveAttribute(
				'src',
				'https://s3.example.com/id-1.jpg?fresh=1',
			);
		});
	});

	it('approves after confirmation, shows a toast and refreshes the list', async () => {
		const user = userEvent.setup();
		renderPage();

		const cards = await screen.findAllByTestId('jp-identity-card');
		await user.click(within(cards[0]).getByRole('button', { name: '승인' }));

		const dialog = await screen.findByRole('dialog');
		expect(within(dialog).getByText('신분증 승인')).toBeInTheDocument();
		await user.click(within(dialog).getByRole('button', { name: '승인' }));

		await waitFor(() => expect(mocked.approve).toHaveBeenCalledWith('sub-1'));
		await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('承認しました。'));
		await waitFor(() => expect(mocked.getPending).toHaveBeenCalledTimes(2));
	});

	it('requires a reason to reject and sends it to the service', async () => {
		const user = userEvent.setup();
		renderPage();

		const cards = await screen.findAllByTestId('jp-identity-card');
		await user.click(within(cards[0]).getByRole('button', { name: '거절' }));

		const dialog = await screen.findByRole('dialog');
		const submit = within(dialog).getByRole('button', { name: '거절하기' });
		expect(submit).toBeDisabled();

		await user.click(within(dialog).getByText('이미지 불선명'));
		expect(submit).toBeEnabled();
		await user.click(submit);

		await waitFor(() =>
			expect(mocked.reject).toHaveBeenCalledWith(
				'sub-1',
				'画像が不鮮明で内容を確認できませんでした。明るい場所で撮り直して再提出してください。',
			),
		);
		await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('却下しました。'));
		await waitFor(() => expect(mocked.getPending).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('treats 409 as already processed and reloads the list', async () => {
		const user = userEvent.setup();
		mocked.approve.mockRejectedValueOnce(new AdminApiError('Already processed', 409, { message: 'Already processed' }));
		renderPage();

		const cards = await screen.findAllByTestId('jp-identity-card');
		await user.click(within(cards[0]).getByRole('button', { name: '승인' }));
		await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '승인' }));

		await waitFor(() =>
			expect(mockToast.warning).toHaveBeenCalledWith('이미 처리된 신청입니다. 목록을 새로고침합니다.'),
		);
		await waitFor(() => expect(mocked.getPending).toHaveBeenCalledTimes(2));
		expect(mockToast.error).not.toHaveBeenCalled();
	});

	it('shows the empty and error states', async () => {
		mocked.getPending.mockResolvedValueOnce([]);
		const { unmount } = renderPage();
		expect(await screen.findByText('대기 중인 신분증이 없습니다')).toBeInTheDocument();
		unmount();

		mocked.getPending.mockRejectedValueOnce(new AdminApiError('boom', 500, { message: 'backend down' }));
		renderPage();
		expect(await screen.findByText('backend down')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '재시도' })).toBeInTheDocument();
	});
});
