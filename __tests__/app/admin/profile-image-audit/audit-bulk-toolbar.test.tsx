import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ProfileImageAuditItem } from '@/app/services/admin';
import { AuditBulkToolbar } from '@/app/admin/profile-image-audit/components/AuditBulkToolbar';

const item = (profileImageId: string, kind: 'profile_image' | 'blind_asset') =>
  ({ profileImageId, kind, selectable: true, userId: 'user-1' }) as ProfileImageAuditItem;

function renderToolbar(items: readonly ProfileImageAuditItem[]) {
  render(
    <AuditBulkToolbar
      group={{
        selectedItems: items,
        selectedIds: items.map((entry) => entry.profileImageId),
        selectedUserIds: ['user-1'],
      }}
      visibleCount={items.length}
      busy={false}
      onSelectVisible={jest.fn()}
      onAction={jest.fn()}
      onBlacklist={jest.fn()}
    />,
  );
}

it('given an upload source card in the selection, allows only 정상 처리 among audit actions', () => {
  renderToolbar([item('photo-1', 'profile_image'), item('blind_asset:asset-1', 'blind_asset')]);

  expect(screen.getByRole('button', { name: /정상 처리/ })).toBeEnabled();
  expect(screen.getByRole('button', { name: /2차 검토/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /사진 변경 요청/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /즉시 삭제/ })).toBeDisabled();
  expect(screen.getByText(/정상 처리만 할 수 있습니다/)).toBeInTheDocument();
});

it('given only profile photos, keeps every audit action available', () => {
  renderToolbar([item('photo-1', 'profile_image')]);

  for (const name of [/정상 처리/, /2차 검토/, /사진 변경 요청/, /즉시 삭제/]) {
    expect(screen.getByRole('button', { name })).toBeEnabled();
  }
  expect(screen.queryByText(/정상 처리만 할 수 있습니다/)).not.toBeInTheDocument();
});
