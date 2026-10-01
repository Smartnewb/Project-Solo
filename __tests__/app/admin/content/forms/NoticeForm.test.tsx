import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockPush = jest.fn();
const mockConfirm = jest.fn(() => Promise.resolve(true));
jest.mock('next/navigation', () => ({useRouter: () => ({push: mockPush})}));
jest.mock('@/app/admin/hooks', () => ({
  useCreateNotice: () => ({mutateAsync: mockCreate, isError:false}),
  useUpdateNotice: () => ({mutateAsync: mockUpdate}),
  useNoticeDetail: () => ({data:undefined,isLoading:false}),
}));
jest.mock('@/shared/ui/admin/toast/toast-context', () => ({useToast: () => ({success:jest.fn(),error:jest.fn()})}));
jest.mock('@/shared/ui/admin/confirm-dialog/confirm-dialog-context', () => ({useConfirm: () => mockConfirm}));
// The real secure editor and card-news payloads are exercised in LongformForm.test.
jest.mock('@/app/admin/content/components/forms/LongformForm', () => ({LongformForm: ({mode,initialHtmlMode}:{mode:string;initialHtmlMode:boolean}) => <section aria-label="HTML 편집기">{mode}:{String(initialHtmlMode)}</section>}));
import { NoticeForm } from '@/app/admin/content/components/forms/NoticeForm';

beforeEach(() => jest.clearAllMocks());
it('opens integrated HTML creation without routing a legacy notice ID or exposing unsupported settings', async () => {
  render(<NoticeForm mode="create" />);
  expect(screen.getByRole('button',{name:/우선순위/})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'HTML 공지 · JP 자동 번역'}));
  expect(await screen.findByRole('region',{name:'HTML 편집기'})).toHaveTextContent('create:true');
  expect(screen.queryByRole('button',{name:/우선순위$/})).not.toBeInTheDocument();
  expect(screen.queryByLabelText('만료 일시 (선택)')).not.toBeInTheDocument();
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockCreate).not.toHaveBeenCalled();
});
it('confirms before discarding an unsaved general notice', async () => {
  render(<NoticeForm mode="create" />);
  fireEvent.change(screen.getByLabelText('제목'),{target:{value:'draft'}});
  fireEvent.click(screen.getByRole('button',{name:'HTML 공지 · JP 자동 번역'}));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
  expect(await screen.findByRole('region',{name:'HTML 편집기'})).toBeInTheDocument();
});
it('retains general notice service contract and native expiry date behavior', async () => {
  mockCreate.mockResolvedValue({id:'notice'});
  render(<NoticeForm mode="create" />);
  fireEvent.change(screen.getByLabelText('제목'),{target:{value:'title'}});
  fireEvent.change(screen.getByLabelText('본문'),{target:{value:'body'}});
  await selectHeroValue('우선순위','high');
  fireEvent.change(screen.getByLabelText('만료 일시 (선택)'),{target:{value:'2026-10-10T12:00'}});
  fireEvent.click(screen.getByRole('button',{name:'저장'}));
  await waitFor(() => expect(mockCreate).toHaveBeenCalled());
  expect(mockCreate.mock.calls[0][0]).toMatchObject({title:'title',content:'body',categoryCode:'notice',priority:'high',expiresAt:new Date('2026-10-10T12:00').toISOString()});
  expect(mockCreate.mock.calls[0][0]).not.toHaveProperty('noticeHtmlInput');
});
it('does not offer silent HTML conversion of existing notice IDs', async()=>{
  render(<NoticeForm mode="edit" id="legacy-notice" />);
  expect(screen.queryByRole('button',{name:'HTML 공지 · JP 자동 번역'})).not.toBeInTheDocument();
});
