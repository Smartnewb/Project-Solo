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
			destinationUrl: 'https://apps.apple.com/app/id6444733685',
			shortCode: 'abc123',
			shortUrl: 'https://links.example.com/go/abc123',
			memo: null,
			createdAt: '2026-04-23T00:00:00.000Z',
		});
	});

	it('sends the backend iOS destination enum when iOS is selected', async () => {
		const user = userEvent.setup();
		render(<UtmLinkCreator onCreated={jest.fn()} />);

		await user.type(screen.getByLabelText(/캠페인/), 'spring');
		await user.click(screen.getByLabelText('iOS'));
		await user.click(screen.getByRole('button', { name: '링크 생성' }));

		await waitFor(() => {
			expect(AdminService.utm.createLink).toHaveBeenCalledWith(
				expect.objectContaining({
					destinationType: 'appstore_ios',
				}),
			);
		});
	});
});
