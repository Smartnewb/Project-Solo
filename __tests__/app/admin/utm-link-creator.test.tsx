import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UtmLinkCreator from '@/app/admin/utm-management/components/utm-link-creator';
import AdminService from '@/app/services/admin';

jest.mock('@/app/services/admin', () => ({
	__esModule: true,
	default: {
		utm: {
			createLink: jest.fn(),
		},
	},
}));

jest.mock('@/shared/ui/admin/toast', () => ({
	useToast: () => ({
		success: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
		info: jest.fn(),
		dismiss: jest.fn(),
		toasts: [],
	}),
}));

jest.mock('qrcode', () => ({
	toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,qr'),
}));

describe('UtmLinkCreator', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(AdminService.utm.createLink as jest.Mock).mockResolvedValue({
			id: 'utm-link-1',
			name: 'everytime_spring',
			utmSource: 'everytime',
			utmMedium: 'community',
			utmCampaign: 'spring',
			utmContent: null,
			destinationType: 'appstore_ios',
			destinationUrl: 'https://apps.apple.com/kr/app/id6746120889',
			shortCode: 'abc123',
			shortUrl: 'https://links.example.com/go/abc123',
			memo: null,
			createdAt: '2026-04-23T00:00:00.000Z',
		});
	});

	it('previews and sends the JP iOS App Store destination', async () => {
		const user = userEvent.setup();
		(AdminService.utm.createLink as jest.Mock).mockResolvedValueOnce({
			id: 'utm-link-jp',
			name: 'tiktok_jp_profile_bio',
			utmSource: 'tiktok',
			utmMedium: 'social',
			utmCampaign: '202607_acquisition_jp',
			utmContent: 'profile_bio',
			destinationType: 'appstore_ios',
			destinationUrl:
				'https://apps.apple.com/jp/app/id6746120889?ct=202607_acquisition_jp&pt=126413580&mt=8',
			shortCode: 'jp123',
			shortUrl: 'https://some-in-univ.com/go/jp123',
			memo: null,
			createdAt: '2026-07-15T00:00:00.000Z',
		});
		render(<UtmLinkCreator onCreated={jest.fn()} />);

		await user.click(screen.getByRole('combobox', { name: /채널/ }));
		await user.click(screen.getByRole('option', { name: '틱톡 오가닉' }));
		await user.type(screen.getByLabelText(/캠페인/), '202607_acquisition_jp');
		await user.type(screen.getByLabelText(/콘텐츠/), 'profile_bio');
		await user.clear(screen.getByLabelText('링크 이름'));
		await user.type(screen.getByLabelText('링크 이름'), 'tiktok_jp_profile_bio');
		await user.click(screen.getByLabelText('iOS'));
		await user.click(screen.getByRole('combobox', { name: 'App Store 지역' }));
		await user.click(screen.getByRole('option', { name: '일본 (JP)' }));

		expect(
			screen.getByText(
				'https://apps.apple.com/jp/app/id6746120889?ct=202607_acquisition_jp&pt=126413580&mt=8',
			),
		).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: '링크 생성' }));

		await waitFor(() => {
			expect(AdminService.utm.createLink).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'tiktok_jp_profile_bio',
					utmSource: 'tiktok',
					utmMedium: 'social',
					utmCampaign: '202607_acquisition_jp',
					utmContent: 'profile_bio',
					destinationType: 'appstore_ios',
					region: 'jp',
				}),
			);
		});
		await user.click(screen.getByRole('button', { name: '닫기' }));
		await waitFor(() => {
			expect(screen.getByRole('combobox', { name: 'App Store 지역' })).toHaveTextContent(
				'대한민국 (KR)',
			);
		});
	});

	it('keeps TikTok organic in the social taxonomy', async () => {
		const user = userEvent.setup();
		render(<UtmLinkCreator onCreated={jest.fn()} />);

		await user.click(screen.getByRole('combobox', { name: /채널/ }));
		await user.click(screen.getByRole('option', { name: '틱톡 오가닉' }));
		await user.type(screen.getByLabelText(/캠페인/), 'organic');

		await user.click(screen.getByRole('button', { name: '링크 생성' }));

		await waitFor(() => {
			expect(AdminService.utm.createLink).toHaveBeenCalledWith(
				expect.objectContaining({
					utmSource: 'tiktok',
					utmMedium: 'social',
				}),
			);
		});
	});

	it('uses the corrected Android package in the preview', async () => {
		const user = userEvent.setup();
		render(<UtmLinkCreator onCreated={jest.fn()} />);

		await user.click(screen.getByLabelText('Android'));

		expect(
			screen.getByText(/https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.smartnewb\.sometimes/),
		).toBeInTheDocument();
	});
});
