import { fireEvent, render, screen } from '@testing-library/react';
import { ArticleCard, type ArticleCardData } from '@/app/admin/community/components/ArticleCard';

const base: ArticleCardData = {
  id: 'a1',
  title: '키큰 여자',
  content: '본문 미리보기',
  anonymous: '익명',
  author: { id: 'u1', name: '홍길동' },
  likeCount: 3,
  commentCount: 2,
  readCount: 10,
  createdAt: new Date().toISOString(),
};

function setup(article: Partial<ArticleCardData> = {}) {
  const handlers = {
    onSelect: jest.fn(),
    onOpen: jest.fn(),
    onOpenAuthor: jest.fn(),
    onPreviewImages: jest.fn(),
    onToggleHot: jest.fn(),
    onToggleBlind: jest.fn(),
    onMoveCategory: jest.fn(),
    onDelete: jest.fn(),
  };
  render(
    <ArticleCard article={{ ...base, ...article }} selected={false} actionLoading={false} {...handlers} />,
  );
  return handlers;
}

describe('ArticleCard', () => {
  it('제목·작성자·수치를 보여주고 본문을 누르면 상세를 연다', () => {
    const h = setup();
    expect(screen.getByText('키큰 여자')).toBeTruthy();
    expect(screen.getByText('익명 · 홍길동')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('키큰 여자 상세 보기'));
    expect(h.onOpen).toHaveBeenCalled();
  });

  it('사진이 있으면 썸네일과 +N 을 보여주고 누르면 미리보기를 연다', () => {
    const h = setup({ imageUrls: ['https://cdn/1.jpg', 'https://cdn/2.jpg'], imageCount: 2 });
    expect(screen.getByText('+1')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('사진 2장 보기'));
    expect(h.onPreviewImages).toHaveBeenCalledWith(['https://cdn/1.jpg', 'https://cdn/2.jpg']);
  });

  it('사진이 없으면 썸네일을 그리지 않는다', () => {
    setup();
    expect(screen.queryByLabelText(/사진 .*장 보기/)).toBeNull();
  });

  it('인기글이면 칩과 "인기글 내리기" 버튼을 보여준다', () => {
    setup({ isHot: true });
    expect(screen.getByText('인기')).toBeTruthy();
    expect(screen.getByText('인기글 내리기')).toBeTruthy();
  });

  it('블라인드 글은 "블라인드 해제" 를 보여준다', () => {
    setup({ blindedAt: new Date().toISOString() });
    expect(screen.getByText('블라인드 해제')).toBeTruthy();
  });
});
