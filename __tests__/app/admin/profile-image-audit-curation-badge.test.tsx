import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileImageAuditCard } from '@/app/admin/profile-image-audit/components/ProfileImageAuditCard';
import { profileImageAuditItemFixture } from '@/__tests__/app/services/fixtures/profile-image-audit';

function renderCard(item: typeof profileImageAuditItemFixture) {
  return render(
    <ProfileImageAuditCard
      item={item}
      selected={false}
      onToggle={jest.fn()}
      onRankChange={jest.fn()}
      rankUpdating={false}
    />,
  );
}

describe('ProfileImageAuditCard 큐레이팅 표시', () => {
  it('큐레이팅 사진이면 사진 칸 제목과 등급 옆 칩으로 보여 준다', () => {
    renderCard({ ...profileImageAuditItemFixture, isCurated: true });

    expect(screen.getByText('✨큐레이팅 (지금 공개)')).toBeInTheDocument();
    expect(screen.getByText('✨큐레이팅 사진')).toBeInTheDocument();
  });

  it('큐레이팅 사진이면 큐레이팅 전 원본을 나란히 보여 준다', () => {
    renderCard({ ...profileImageAuditItemFixture, isCurated: true, curationOriginalImageUrl: 'https://cdn.example.com/before.jpg' });

    expect(screen.getByText('원본')).toBeInTheDocument();
    expect(screen.getByText('✨큐레이팅 (지금 공개)')).toBeInTheDocument();
    expect(screen.getByAltText(`${profileImageAuditItemFixture.profileImageId} 큐레이팅 전 원본`)).toHaveAttribute('src', 'https://cdn.example.com/before.jpg');
  });

  it('서버가 원본 주소를 아직 안 보내면 원본 칸에 연결 없음을 적는다', () => {
    renderCard({ ...profileImageAuditItemFixture, isCurated: true });

    expect(screen.getByTestId('audit-curation-original')).toHaveTextContent('원본 연결 없음');
  });

  it('큐레이팅 사진이 아니거나 서버가 값을 보내지 않으면 표시하지 않는다', () => {
    const { rerender } = renderCard({ ...profileImageAuditItemFixture, isCurated: false });
    expect(screen.queryByTestId('audit-curation-badge')).not.toBeInTheDocument();

    rerender(
      <ProfileImageAuditCard
        item={{ ...profileImageAuditItemFixture, isCurated: undefined }}
        selected={false}
        onToggle={jest.fn()}
        onRankChange={jest.fn()}
        rankUpdating={false}
      />,
    );
    expect(screen.queryByTestId('audit-curation-badge')).not.toBeInTheDocument();
    expect(screen.queryByText('✨큐레이팅 사진')).not.toBeInTheDocument();
    expect(screen.queryByTestId('audit-curation-original')).not.toBeInTheDocument();
    expect(screen.getByText('큐레이팅 안 함')).toBeInTheDocument();
  });
});
