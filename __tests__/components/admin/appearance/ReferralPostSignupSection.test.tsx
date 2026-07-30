import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { referrals } from '@/app/services/admin/referrals';
import { ReferralPostSignupSection } from '@/components/admin/appearance/referral/ReferralPostSignupSection';

jest.mock('@/app/services/admin/referrals', () => ({
	referrals: {
		preview: jest.fn(),
		connect: jest.fn(),
	},
}));

const confirm = jest.fn().mockResolvedValue(true);
jest.mock('@/shared/ui/admin/confirm-dialog', () => ({
	useConfirm: () => confirm,
}));

const preview = {
	state: 'CLEAN',
	reason: null,
	invitee: {
		id: 'invitee-1',
		name: '피초대자',
		phoneSuffix: '***2222',
		status: 'approved',
		createdAt: '2026-07-29T00:00:00.000Z',
	},
	inviter: {
		id: 'inviter-1',
		name: '초대자',
		phoneSuffix: '***8888',
		status: 'approved',
		referralCode: 'ABC12345',
	},
	invitation: null,
	allowedActions: ['STANDARD'],
} as const;

describe('ReferralPostSignupSection', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		let sequence = 0;
		Object.defineProperty(global.crypto, 'randomUUID', {
			configurable: true,
			value: jest.fn(() => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`),
		});
		(referrals.preview as jest.Mock).mockResolvedValue(preview);
		(referrals.connect as jest.Mock).mockResolvedValue({
			...preview,
			state: 'COMPLETED',
			allowedActions: [],
		});
	});

	it('userId가 바뀌면 이전 코드·preview를 초기화한다', async () => {
		const { rerender } = render(
			<ReferralPostSignupSection userId="invitee-1" createdAt="2026-07-29" />,
		);

		fireEvent.change(screen.getByLabelText('초대코드'), {
			target: { value: 'ABC12345' },
		});
		fireEvent.click(screen.getByRole('button', { name: '조회' }));
		await screen.findByText(/초대한 사람: 초대자/);

		rerender(
			<ReferralPostSignupSection userId="invitee-2" createdAt="2026-07-30" />,
		);

		await waitFor(() => {
			expect((screen.getByLabelText('초대코드') as HTMLInputElement).value).toBe('');
			expect(screen.queryByText(/초대한 사람: 초대자/)).toBeNull();
		});
	});

	it('사용자가 바뀐 뒤 실행하는 요청은 새 idempotency key를 사용한다', async () => {
		const { rerender } = render(
			<ReferralPostSignupSection userId="invitee-1" createdAt="2026-07-29" />,
		);

		fireEvent.change(screen.getByLabelText('초대코드'), {
			target: { value: 'ABC12345' },
		});
		fireEvent.click(screen.getByRole('button', { name: '조회' }));
		await screen.findByRole('button', { name: '연결 및 보상' });
		fireEvent.click(screen.getByRole('button', { name: '연결 및 보상' }));
		await waitFor(() => expect(referrals.connect).toHaveBeenCalledTimes(1));

		rerender(
			<ReferralPostSignupSection userId="invitee-2" createdAt="2026-07-30" />,
		);
		fireEvent.change(screen.getByLabelText('초대코드'), {
			target: { value: 'ZZZZ9999' },
		});
		fireEvent.click(screen.getByRole('button', { name: '조회' }));
		await screen.findByRole('button', { name: '연결 및 보상' });
		fireEvent.click(screen.getByRole('button', { name: '연결 및 보상' }));
		await waitFor(() => expect(referrals.connect).toHaveBeenCalledTimes(2));

		const firstKey = (referrals.connect as jest.Mock).mock.calls[0][2];
		const secondKey = (referrals.connect as jest.Mock).mock.calls[1][2];
		expect(firstKey).not.toBe(secondKey);
		expect((referrals.connect as jest.Mock).mock.calls[1][0]).toBe('invitee-2');
	});

	it('늦게 도착한 이전 코드 조회 결과를 표시하거나 실행하지 않는다', async () => {
		let resolveFirst: (value: typeof preview) => void = () => undefined;
		const firstRequest = new Promise<typeof preview>((resolve) => {
			resolveFirst = resolve;
		});
		(referrals.preview as jest.Mock)
			.mockReturnValueOnce(firstRequest)
			.mockResolvedValueOnce({
				...preview,
				inviter: { ...preview.inviter, name: '두 번째 초대자', referralCode: 'BBBB2222' },
			});

		render(<ReferralPostSignupSection userId="invitee-1" createdAt="2026-07-29" />);

		fireEvent.change(screen.getByLabelText('초대코드'), {
			target: { value: 'AAAA1111' },
		});
		fireEvent.click(screen.getByRole('button', { name: '조회' }));

		fireEvent.change(screen.getByLabelText('초대코드'), {
			target: { value: 'BBBB2222' },
		});
		fireEvent.click(screen.getByRole('button', { name: '조회' }));
		await screen.findByText(/초대한 사람: 두 번째 초대자/);

		resolveFirst(preview);
		await waitFor(() => {
			expect(screen.queryByText(/^초대한 사람: 초대자/)).toBeNull();
		});

		fireEvent.click(screen.getByRole('button', { name: '연결 및 보상' }));
		await waitFor(() => expect(referrals.connect).toHaveBeenCalledTimes(1));
		expect((referrals.connect as jest.Mock).mock.calls[0][1].referralCode).toBe('BBBB2222');
	});

	it('실행 버튼을 연속으로 눌러도 연결 요청은 한 번만 보낸다', async () => {
		let resolveConfirm: (value: boolean) => void = () => undefined;
		confirm.mockReturnValueOnce(new Promise<boolean>((resolve) => {
			resolveConfirm = resolve;
		}));

		render(<ReferralPostSignupSection userId="invitee-1" createdAt="2026-07-29" />);
		fireEvent.change(screen.getByLabelText('초대코드'), {
			target: { value: 'ABC12345' },
		});
		fireEvent.click(screen.getByRole('button', { name: '조회' }));
		const executeButton = await screen.findByRole('button', { name: '연결 및 보상' });

		fireEvent.click(executeButton);
		fireEvent.click(executeButton);
		expect(confirm).toHaveBeenCalledTimes(1);

		resolveConfirm(true);
		await waitFor(() => expect(referrals.connect).toHaveBeenCalledTimes(1));
	});
});
