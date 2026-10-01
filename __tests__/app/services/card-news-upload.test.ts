jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminRequest: jest.fn(),
}));

import AdminService from '@/app/services/admin';
import { adminRequest } from '@/shared/lib/http/admin-fetch';

describe('cardNews.uploadSectionImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the card-news section upload endpoint through the BFF', async () => {
    (adminRequest as jest.Mock).mockResolvedValue({ data: { url: 'https://example.com/section.png' } });

    const file = new File(['image'], 'section.png', { type: 'image/png' });
    await AdminService.cardNews.uploadSectionImage(file);

    expect(adminRequest).toHaveBeenCalledWith(
      '/admin/v2/content/card-news/section-images/upload',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
  });
});
