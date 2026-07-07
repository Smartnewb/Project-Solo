import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UtmLinkList from '@/app/admin/utm-management/components/utm-link-list';
import AdminService from '@/app/services/admin';

jest.mock('@/app/services/admin', () => ({
	__esModule: true,
	default: {
		utm: {
			getLinks: jest.fn(),
			updateLink: jest.fn(),
			deleteLink: jest.fn(),
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

jest.mock('@/shared/ui/admin/confirm-dialog', () => ({
	useConfirm: () => jest.fn(),
}));

describe('UtmLinkList', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(AdminService.utm.getLinks as jest.Mock).mockResolvedValue({
			data: [
				{
					id: 'utm-link-1',
					name: 'naver_blog_12_website',
					utmSource: 'naver_blog',
					utmMedium: 'blog',
					utmCampaign: 'naver_blog_12',
					utmContent: 'website',
					destinationType: 'web',
					destinationUrl:
						'https://some-in-univ.com/?utm_source=naver_blog&utm_medium=blog&utm_campaign=naver_blog_12&utm_content=website',
					shortCode: 'sometime-blog-12',
					shortUrl: 'https://api.some-in-univ.com/go/sometime-blog-12',
					memo: null,
					createdAt: '2026-07-06T05:05:22.209Z',
					clickCount: 0,
					signupCount: 0,
					bindings: [],
				},
			],
			meta: { total: 1, page: 1, limit: 20 },
		});
	});

	it('shows tracking and destination URLs in the link table', async () => {
		render(<UtmLinkList refreshKey={0} />);

		expect(await screen.findByText('https://api.some-in-univ.com/go/sometime-blog-12')).toBeInTheDocument();
		expect(
			screen.getByText(
				'도착: https://some-in-univ.com/?utm_source=naver_blog&utm_medium=blog&utm_campaign=naver_blog_12&utm_content=website',
			),
		).toBeInTheDocument();
	});
});
