import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BroadcastHistoryClient from '@/app/admin/broadcast-push/history-client';
import BroadcastFormClient from '@/app/admin/broadcast-push/broadcast-form-client';
import BroadcastDetailClient from '@/app/admin/broadcast-push/[id]/broadcast-detail-client';
import AdminService from '@/app/services/admin';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }), useParams: () => ({ id: 'schedule-1' }), useSearchParams: () => new URLSearchParams() }));
jest.mock('@/shared/contexts/admin-session-context', () => ({ useAdminSession: () => ({ session: { user: { id: 'admin-1' } } }) }));
jest.mock('@/shared/ui/admin/toast', () => ({ useToast: () => ({ error: jest.fn(), success: jest.fn() }) }));
jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: { pushBroadcast: { listSchedules: jest.fn(), getSchedule: jest.fn(), schedule: jest.fn(), test: jest.fn() }, pushGroups: { list: jest.fn(), get: jest.fn(), preview: jest.fn() } },
  countriesForScope: (scope: string) => scope === 'both' ? ['kr', 'jp'] : [scope],
  BROADCAST_STATUS_LABEL: { scheduled: '예약됨', sent: '발송완료', failed: '실패' },
}));
const schedule = {
  id: 'schedule-1', krTitle: '한국어 안내', krBody: '한국어 본문 내용', jpTitle: '日本語 안내', jpBody: '日本語 本文 내용',
  scheduledAt: '2026-10-03T01:00:00Z', createdAt: '2026-10-02T01:00:00Z', status: 'scheduled',
  targetGroupId: 'group-1', sentCount: 0, failedCount: 0, targetPreviewCount: 42,
};
beforeEach(() => {
  jest.clearAllMocks();
  (AdminService.pushBroadcast.listSchedules as jest.Mock).mockResolvedValue([schedule]);
  (AdminService.pushBroadcast.getSchedule as jest.Mock).mockResolvedValue(schedule);
  (AdminService.pushGroups.list as jest.Mock).mockResolvedValue([{ id: 'group-1', name: '선택한 그룹' }]);
  (AdminService.pushGroups.preview as jest.Mock).mockResolvedValue({ kr: 42, jp: 0, total: 42 });
  (AdminService.pushGroups.get as jest.Mock).mockResolvedValue({ name: '선택한 그룹' });
});
it('renders an accessible detail link, group label, and HeroUI create action', async () => {
  render(<BroadcastHistoryClient />);
  const link = await screen.findByRole('link', { name: '한국어 안내' });
  expect(link.getAttribute('href')).toBe('/admin/broadcast-push/schedule-1');
  expect(screen.getByText('선택한 그룹')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '새 예약 발송' }));
  expect(push).toHaveBeenCalledWith('/admin/broadcast-push/new');
});
it('keeps both country copies and group lookup in detail', async () => {
  render(<BroadcastDetailClient />);
  await screen.findByRole('heading', { name: '예약 발송 상세' });
  await waitFor(() => expect(screen.getByText('선택한 그룹')).toBeTruthy());
  expect(screen.getByText('한국어 본문 내용')).toBeTruthy();
  expect(screen.getByText('日本語 本文 내용')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '목록' }));
  expect(push).toHaveBeenCalledWith('/admin/broadcast-push');
});

it('preserves country copies and explicit confirmation before scheduling with real HeroUI controls', async () => {
  (AdminService.pushBroadcast.schedule as jest.Mock).mockResolvedValue({ id: 'new-schedule', targetPreviewCount: 42, scheduledAt: '2099-10-03T01:00:00Z' });
  render(<BroadcastFormClient />);
  expect((screen.getByRole('radio', {name: '광고성 (이벤트·혜택·재방문 유도)'}) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('radio', {name: '정보성 (공지·거래·서비스 안내)'}));
  const register = screen.getByRole('button', { name: '예약 등록' }) as HTMLButtonElement;
  expect(register.disabled).toBe(true);
  for (const [label, value] of [['KR 제목','KR title'], ['KR 본문','KR body'], ['JP 제목','JP title'], ['JP 본문','JP body']]) {
    fireEvent.change(screen.getByRole('textbox', { name: label }), { target: { value } });
  }
  fireEvent.change(screen.getByLabelText('발송 예정 시각 (기기 현지 시간)'), { target: { value: '2099-10-03T10:00' } });
  expect(register.disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: '테스트 푸시를 수신했음을 확인했습니다.' }));
  fireEvent.click(register);
  expect(AdminService.pushBroadcast.schedule).not.toHaveBeenCalled();
  const confirm = await screen.findByRole('button', { name: '예약 등록 진행' });
  fireEvent.click(confirm);
  await waitFor(() => expect(AdminService.pushBroadcast.schedule).toHaveBeenCalledWith({
    krTitle: 'KR title', krBody: 'KR body', jpTitle: 'JP title', jpBody: 'JP body', legalClass: 'informational',
    deepLink: undefined, scheduledAt: new Date('2099-10-03T10:00').toISOString(),
  }));
  await screen.findByRole('heading', { name: '예약 등록 완료' });
});

it('retains group search and requests the selected group preview', async () => {
  (AdminService.pushGroups.list as jest.Mock).mockResolvedValue([
    { id: 'group-1', name: '대학생 그룹', type: 'static', countryScope: 'kr' },
    { id: 'group-2', name: '일본 그룹', type: 'dynamic', countryScope: 'jp' },
  ]);
  render(<BroadcastFormClient />);
  fireEvent.click(screen.getByRole('radio', { name: '특정 그룹' }));
  const input = await screen.findByRole('combobox', { name: '타겟 그룹 선택' });
  await waitFor(() => expect((input as HTMLInputElement).disabled).toBe(false));
  const user = userEvent.setup();
  await user.click(input);
  await user.type(input, '대학생');
  const option = await screen.findByRole('option', { name: /대학생 그룹/ });
  expect(screen.queryByRole('option', { name: /일본 그룹/ })).toBeNull();
  await user.click(option);
  await waitFor(() => expect(AdminService.pushGroups.preview).toHaveBeenCalledWith('group-1'));
  expect(screen.getByRole('textbox', { name: 'KR 제목' })).toBeTruthy();
  expect(screen.queryByRole('textbox', { name: 'JP 제목' })).toBeNull();
});
