jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminRequest: jest.fn(),
  adminGet: jest.fn(),
  adminPost: jest.fn(),
  adminPatch: jest.fn(),
  adminDelete: jest.fn(),
}));

import communityService from '@/app/services/community';
import { adminDelete, adminGet, adminPost } from '@/shared/lib/http/admin-fetch';

describe('community 인기글 올리기/내리기', () => {
  beforeEach(() => jest.clearAllMocks());

  it('올리기는 POST posts/:id/hot', async () => {
    await communityService.promoteHotArticle('a1');
    expect(adminPost).toHaveBeenCalledWith('/admin/v2/community/posts/a1/hot', {});
  });

  it('내리기는 DELETE posts/:id/hot', async () => {
    await communityService.demoteHotArticle('a1');
    expect(adminDelete).toHaveBeenCalledWith('/admin/v2/community/posts/a1/hot');
  });

  it('목록 응답의 hotId 로 isHot 을 계산한다', async () => {
    (adminGet as jest.Mock).mockResolvedValue({
      data: [
        { id: 'a1', content: 'x', hotId: 'h1' },
        { id: 'a2', content: 'y' },
      ],
      meta: {},
    });
    const res = await communityService.getArticles();
    expect(res.items.map((a) => a.isHot)).toEqual([true, false]);
  });
});
