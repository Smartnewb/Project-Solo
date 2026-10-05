import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import { festivalMate, type FestivalApplicantProfile, type FestivalEvent } from '@/app/services/admin/festival-mate';
import { userAppearance } from '@/app/services/admin/users';
import FestivalMateAdminClient from './festival-mate-admin-client';

jest.mock('@/shared/contexts/admin-session-context', () => ({ useAdminSession: jest.fn() }));
jest.mock('@/app/services/admin/festival-mate', () => ({
  ...jest.requireActual('@/app/services/admin/festival-mate'),
  festivalMate: { getEvents: jest.fn(), getParticipants: jest.fn(), getProfile: jest.fn(), updateEvent: jest.fn() },
}));
jest.mock('@/app/services/admin/users', () => ({ userAppearance: { getUserDetails: jest.fn() } }));
// Keep the actual HeroUI controls; isolate only the existing heavy member editor.
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => function MockMemberModal({ userId, onClose }: { userId: string; onClose: () => void }) {
    return <div role="dialog" aria-label="회원 관리"><span>{userId}</span><button onClick={onClose}>회원창 닫기</button></div>;
  },
}));

const events: FestivalEvent[] = [
  { id: 'event-a', name: '학교 A 축제', location: '개최 학교 A', country: 'kr', slug: 'a', startsAt: '2026-10-04T00:00:00Z', endsAt: '2026-10-06T00:00:00Z', previewFrom: null, applyOpensAt: null, hiddenAt: null },
  { id: 'event-b', name: '학교 B 축제', location: '개최 학교 B', country: 'kr', slug: 'b', startsAt: '2026-09-04T00:00:00Z', endsAt: '2026-09-06T00:00:00Z', previewFrom: null, applyOpensAt: null, hiddenAt: null },
];
function member(userId: string, changes: Partial<FestivalApplicantProfile> = {}): FestivalApplicantProfile {
  return { userId, name: `회원 ${userId}`, nickname: '별명', universityName: '신청자 소속 학교', gender: 'FEMALE', country: 'kr', status: 'approved', isSuspended: false, isTest: false, isFaker: false, images: [], ...changes };
}
const queries: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  queries.push(client);
  const tree = () => <QueryClientProvider client={client}><FestivalMateAdminClient /></QueryClientProvider>;
  const view = render(tree());
  return { ...view, rerenderPage: () => view.rerender(tree()) };
}
const service = jest.mocked(festivalMate);
const session = jest.mocked(useAdminSession);

beforeEach(() => {
  jest.clearAllMocks();
  session.mockReturnValue({ session: { selectedCountry: 'KR' } } as ReturnType<typeof useAdminSession>);
  service.getEvents.mockResolvedValue([events[0]]);
  service.getParticipants.mockResolvedValue([{ userId: 'one', joinedAt: '2026-10-04T00:30:00Z' }]);
  service.getProfile.mockImplementation(async (id) => member(id));
  service.updateEvent.mockImplementation(async (id, values) => ({ ...events[0], id, ...values }));
  jest.mocked(userAppearance.getUserDetails).mockImplementation(async (id) => ({ id, country: 'kr' }));
});
afterEach(() => queries.splice(0).forEach((client) => client.clear()));

it('distinguishes the host school from applicants’ schools and preserves failed rows', async () => {
  service.getParticipants.mockResolvedValue([
    { userId: 'one', joinedAt: '2026-10-04T00:30:00Z' },
    { userId: 'missing', joinedAt: '2026-10-04T00:31:00Z' },
  ]);
  service.getProfile.mockImplementation(async (id) => {
    if (id === 'missing') throw new Error('404 회원 정보 없음');
    return member(id);
  });
  mount();
  const table = await screen.findByRole('table');
  expect(screen.getByText('개최 학교·장소: 개최 학교 A')).toBeVisible();
  expect(within(table).getByText('신청자 소속 학교')).toBeVisible();
  const failed = within(table).getByText('missing').closest('tr')!;
  expect(within(failed).getAllByText('회원 조회 실패')).toHaveLength(2);
  expect(within(failed).getByRole('button', { name: 'missing 회원 상세' })).toBeDisabled();
  expect(within(failed).queryByText('탈퇴', { exact: true })).not.toBeInTheDocument();
  expect(within(table).getByText('탈퇴 여부 미제공')).toBeVisible();
});

it('resets member modal and rows immediately on event switch', async () => {
  service.getEvents.mockResolvedValue(events);
  service.getParticipants.mockImplementation(async (id) => [{ userId: id === 'event-a' ? 'one' : 'two', joinedAt: events[0].startsAt }]);
  mount();
  fireEvent.click(await screen.findByRole('button', { name: '회원 one 회원 상세' }));
  expect(await screen.findByRole('dialog', { name: '회원 관리' })).toHaveTextContent('one');
  fireEvent.change(screen.getByLabelText('축제', { exact: true }), { target: { value: 'event-b' } });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('회원 one')).not.toBeInTheDocument();
  expect(await screen.findByText('회원 two')).toBeVisible();
  expect(service.getParticipants).toHaveBeenLastCalledWith('event-b', expect.any(AbortSignal));
});

it('remounts all event/member state and country-scopes requests on session country switch', async () => {
  service.getEvents.mockImplementation(async (country) => country === 'kr' ? [events[0]] : [{ ...events[1], id: 'jp-event', country: 'jp', name: '일본 축제' }]);
  service.getParticipants.mockImplementation(async (id) => [{ userId: id === 'jp-event' ? 'jp-user' : 'one', joinedAt: events[0].startsAt }]);
  service.getProfile.mockImplementation(async (id, country) => member(id, { country }));
  const view = mount();
  fireEvent.click(await screen.findByRole('button', { name: '회원 one 회원 상세' }));
  await screen.findByRole('dialog');
  session.mockReturnValue({ session: { selectedCountry: 'JP' } } as ReturnType<typeof useAdminSession>);
  view.rerenderPage();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('회원 one')).not.toBeInTheDocument();
  expect(await screen.findByText('회원 jp-user')).toBeVisible();
  expect(service.getEvents).toHaveBeenLastCalledWith('jp', expect.any(AbortSignal));
  expect(service.getProfile).toHaveBeenLastCalledWith('jp-user', 'jp', expect.any(AbortSignal));
});

it('shows a real empty registration list as zero with an explicit empty state', async () => {
  service.getParticipants.mockResolvedValue([]);
  mount();
  expect(await screen.findByText('아직 사전 신청자가 없습니다.')).toBeVisible();
  expect(service.getProfile).not.toHaveBeenCalled();
  const summary = screen.getByRole('region', { name: '신청 요약' });
  expect(within(summary).getByText('전체 사전 신청').parentElement).toHaveTextContent('0');
  expect(screen.getByRole('button', { name: 'CSV 내려받기' })).toBeDisabled();
});

it('does not display a participant API failure as a successful zero total', async () => {
  service.getParticipants.mockRejectedValue(new Error('서버 오류'));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('신청 목록 조회 실패: 서버 오류');
  expect(screen.queryByText('아직 사전 신청자가 없습니다.')).not.toBeInTheDocument();
  const summary = screen.getByRole('region', { name: '신청 요약' });
  expect(within(summary).getByText('전체 사전 신청').parentElement).toHaveTextContent('—');
  expect(service.getProfile).not.toHaveBeenCalled();
});

it('does not display an event API failure as an empty country', async () => {
  service.getEvents.mockRejectedValue(new Error('권한 없음'));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('축제 목록을 불러오지 못했습니다. 권한 없음');
  expect(screen.queryByText('이 국가에 등록된 축제/오프라인 행사가 없습니다.')).not.toBeInTheDocument();
  expect(service.getParticipants).not.toHaveBeenCalled();
});

it('paginates 25 applicants and resets to page one when applying filters', async () => {
  service.getParticipants.mockResolvedValue(Array.from({ length: 25 }, (_, i) => ({ userId: `user-${i}`, joinedAt: events[0].startsAt })));
  mount();
  const table = await screen.findByRole('table');
  expect(within(table).getAllByRole('row')).toHaveLength(21);
  expect(screen.getByText('1 / 2 페이지')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '다음', exact: true }));
  expect(within(table).getAllByRole('row')).toHaveLength(6);
  expect(screen.getByText('회원 user-24')).toBeVisible();
  fireEvent.change(screen.getByLabelText('검색', { exact: true }), { target: { value: 'user-24' } });
  expect(screen.getByText('1 / 1 페이지')).toBeVisible();
  expect(within(table).getAllByRole('row')).toHaveLength(2);
  expect(screen.getByRole('button', { name: '다음', exact: true })).toBeDisabled();
});

it('CSV exports all filtered applicants, not only the currently visible page', async () => {
  service.getParticipants.mockResolvedValue(Array.from({ length: 25 }, (_, i) => ({ userId: `user-${i}`, joinedAt: events[0].startsAt })));
  let downloaded: Blob | undefined;
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn((blob: Blob) => { downloaded = blob; return 'blob:export'; }) });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  mount();
  await screen.findByRole('table');
  fireEvent.change(screen.getByLabelText('검색', { exact: true }), { target: { value: 'user-' } });
  fireEvent.click(screen.getByRole('button', { name: 'CSV 내려받기' }));
  await waitFor(() => expect(downloaded).toBeDefined());
  const csv = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(downloaded!);
  });
  expect(csv.split('\r\n')).toHaveLength(26);
  expect(csv).toContain('"user-24"');
  expect(click).toHaveBeenCalledTimes(1);
  click.mockRestore();
});

it('metadata editor saves only the trimmed host/name for the selected event', async () => {
  mount();
  await screen.findByRole('table');
  fireEvent.click(screen.getByRole('button', { name: '축제 정보 수정' }));
  fireEvent.change(screen.getByLabelText('축제 이름', { exact: true }), { target: { value: ' 새 축제 ' } });
  fireEvent.change(screen.getByLabelText('개최 학교·장소 수정', { exact: true }), { target: { value: ' 새 개최 학교 ' } });
  fireEvent.click(screen.getByRole('button', { name: '저장', exact: true }));
  await waitFor(() => expect(service.updateEvent).toHaveBeenCalledWith('event-a', { name: '새 축제', location: '새 개최 학교' }));
  expect(await screen.findByText('축제 정보를 저장했습니다.')).toBeVisible();
});

it('keeps the selected festival visible when renaming its currently filtered host school', async () => {
  let authoritative = events.map((event) => ({ ...event }));
  service.getEvents.mockImplementation(async () => authoritative);
  service.updateEvent.mockImplementation(async (id, values) => {
    authoritative = authoritative.map((event) => event.id === id ? { ...event, ...values } : event);
    return authoritative.find((event) => event.id === id)!;
  });
  mount();
  await screen.findByRole('table');
  fireEvent.change(screen.getByLabelText('개최 학교·장소', { exact: true }), { target: { value: '개최 학교 A' } });
  fireEvent.click(screen.getByRole('button', { name: '축제 정보 수정' }));
  fireEvent.change(screen.getByLabelText('개최 학교·장소 수정', { exact: true }), { target: { value: '새 개최 학교 A' } });
  fireEvent.click(screen.getByRole('button', { name: '저장', exact: true }));
  expect(await screen.findByText('축제 정보를 저장했습니다.')).toBeVisible();
  expect(screen.getByLabelText('개최 학교·장소', { exact: true })).toHaveValue('새 개최 학교 A');
  expect(screen.getByLabelText('축제', { exact: true })).toHaveValue('event-a');
  expect(screen.getByText('개최 학교·장소: 새 개최 학교 A')).toBeVisible();
  expect(screen.getByText('회원 one')).toBeVisible();
  expect(screen.queryByText('조건에 맞는 축제 없음')).not.toBeInTheDocument();
});
