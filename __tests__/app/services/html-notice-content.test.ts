jest.mock('@/shared/lib/http/admin-fetch', () => ({
  adminGet: jest.fn(),
  adminPost: jest.fn(),
  adminPut: jest.fn(),
  adminPatch: jest.fn(),
  adminDelete: jest.fn(),
  adminRequest: jest.fn(),
}));

import { cardNews } from '@/app/services/admin/content';
import { adminGet, adminPost, adminPut, adminRequest } from '@/shared/lib/http/admin-fetch';
import type { NoticeHtmlPreviewRequest } from '@/types/admin';

const input: NoticeHtmlPreviewRequest = {
  title: '공지', categoryCode: 'announcement', layoutMode: 'longform', hasReward: false,
  noticeHtmlInput: { html: '<p>공지</p>', css: 'p{color:black}' },
};

beforeEach(() => jest.clearAllMocks());

it('미리보기 문구 수정은 텍스트 ID와 문구만 보내고 재검증 결과를 받는다', async () => {
  const request = { ...input, textEdits: [{ id: 't0', text: '<b>새로운 문구</b>' }] };
  const result = { previewDigest: 'updated', kr: { safeHtml: '<p>&lt;b&gt;새로운 문구&lt;/b&gt;</p>' }, document: 'validated', textSegments: request.textEdits };
  (adminPost as jest.Mock).mockResolvedValue({ data: result });
  expect(await cardNews.previewHtml(request)).toEqual(result);
  expect(adminPost).toHaveBeenCalledWith('/admin/v2/content/card-news/html-preview', request);
});

it('검증 미리보기는 원본과 메타를 BFF API에 보내고 검증된 문서만 반환한다', async () => {
  // given
  const preview = { previewDigest: 'digest', kr: { safeHtml: '<p>공지</p>' }, document: '<!doctype html>safe' };
  (adminPost as jest.Mock).mockResolvedValue({ data: preview });
  // when
  const result = await cardNews.previewHtml(input);
  // then
  expect(adminPost).toHaveBeenCalledWith('/admin/v2/content/card-news/html-preview', input);
  expect(result).toEqual(preview);
});

it('공지 이미지는 전용 경로와 multipart image 필드로 전송한다', async () => {
  // given
  const file = new File(['image'], 'notice.png', { type: 'image/png' });
  (adminRequest as jest.Mock).mockResolvedValue({ data: { url: 'https://images.example.com/card-news/notices/a.webp' } });
  // when
  const result = await cardNews.uploadHtmlImage(file);
  // then
  expect(result.url).toContain('/card-news/notices/');
  expect(adminRequest).toHaveBeenCalledWith('/admin/v2/content/card-news/html-images/upload', {
    method: 'POST', body: expect.any(FormData),
  });
  expect((adminRequest as jest.Mock).mock.calls[0][1].body.get('image')).toEqual(file);
  expect((adminRequest as jest.Mock).mock.calls[0][1].credentials).toBeUndefined();
});

it('직전 안전본 복원 요청에는 현재 리비전을 포함한다', async () => {
  // given
  (adminPost as jest.Mock).mockResolvedValue({ data: { id: 'notice', noticeHtmlState: { revision: 3 } } });
  // when
  const result = await cardNews.restoreHtml('notice', 2);
  // then
  expect(adminPost).toHaveBeenCalledWith('/admin/v2/content/card-news/notice/html-restore', { expectedRevision: 2 });
  expect(result.noticeHtmlState?.revision).toBe(3);
});

it('HTML 수정은 원본과 미리보기 digest 및 리비전을 그대로 전송한다', async () => {
  // given
  const payload = { noticeHtmlInput: { html: '<p>수정</p>', previewDigest: 'digest', expectedRevision: 2 } };
  (adminPut as jest.Mock).mockResolvedValue({ data: { id: 'notice' } });
  // when
  await cardNews.update('notice', payload);
  // then
  expect(adminPut).toHaveBeenCalledWith('/admin/v2/content/card-news/notice', payload);
});

it('비동기 국가별 발행에도 기대 리비전과 푸시 문구를 유지한다', async () => {
  // given
  const payload = { expectedRevision: 2, pushNotificationMessage: '공지 확인' };
  (adminPost as jest.Mock).mockResolvedValue({ data: { success: true, sentCount: 0, message: '대기' } });
  // when
  const result = await cardNews.publish('notice', payload);
  // then
  expect(adminPost).toHaveBeenCalledWith('/admin/v2/content/card-news/notice/publish', payload);
  expect(result.message).toBe('대기');
});

it('목록은 HTML 상태와 리비전을 제거하지 않는다', async () => {
  // given
  const item = { id: 'notice', noticeHtmlState: { revision: 7 } };
  (adminGet as jest.Mock).mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1 } });
  // when
  const result = await cardNews.getList({ track: 'longform' });
  // then
  expect(result.items[0].noticeHtmlState?.revision).toBe(7);
});

it('국가별 번역 상태 상세 조회는 캐시를 재사용하지 않는다', async () => {
  // given
  (adminRequest as jest.Mock).mockResolvedValue({ data: { id: 'notice', noticeHtmlState: { revision: 2 } } });
  // when
  const result = await cardNews.get('notice');
  // then
  expect(adminRequest).toHaveBeenCalledWith('/admin/v2/content/card-news/notice', { cache: 'no-store' });
  expect(result.noticeHtmlState?.revision).toBe(2);
});
