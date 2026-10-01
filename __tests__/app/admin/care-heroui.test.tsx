import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CareLogsV2 from '@/app/admin/care/logs/care-logs-v2';
import CareV2 from '@/app/admin/care/care-v2';
import CareTargetList from '@/app/admin/care/components/CareTargetList';
import CareExecuteModal from '@/app/admin/care/components/CareExecuteModal';
import AdminService from '@/app/services/admin';
import type { CareTarget, CarePartner } from '@/app/services/admin/care';

jest.mock('@/app/services/admin', () => ({ __esModule: true, default: { care: { getTargets: jest.fn(), getPartners: jest.fn(), execute: jest.fn(), dismiss: jest.fn(), getLogs: jest.fn() } } }));
jest.mock('@/shared/ui/admin/confirm-dialog', () => ({ useConfirm: () => jest.fn().mockResolvedValue(true) }));
jest.mock('@/shared/ui/admin/toast', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn() }) }));
const target: CareTarget = { id:'target-1', user_id:'user-1', consecutive_failure_days:7, last_failure_reason:'상대 없음', last_failure_at:null, engagement_score:null, gender:'MALE', status:'pending', created_at:'2026-10-01', name:'대상 일', birthday:'2001-01-01', introduction:'소개', user_status:'ACTIVE', university_name:'대학', profile_image_url:null };
const partner: CarePartner = { userId:'partner-1', name:'파트너 일', age:24, gender:'FEMALE', universityName:'파트너 대학', profileImageUrl:null };
beforeEach(() => {
  jest.clearAllMocks();
  (AdminService.care.getTargets as jest.Mock).mockResolvedValue({items:[target], page:1, limit:20, total:1});
  (AdminService.care.getPartners as jest.Mock).mockResolvedValue([partner]);
  (AdminService.care.execute as jest.Mock).mockResolvedValue({success:true});
});
it('supports keyboard target selection and paging while a search is active', async () => {
  const select = jest.fn(), page = jest.fn();
  const user = userEvent.setup();
  render(<CareTargetList targets={[target]} selectedTarget={null} onSelect={select} loading={false} searchTerm="대상" onSearchChange={jest.fn()} pagination={{page:1,limit:20,total:41}} onPageChange={page} />);
  const button = screen.getByRole('button', {name:/대상 일/});
  act(() => button.focus());
  await user.keyboard('{Enter}');
  expect(select).toHaveBeenCalledWith(target);
  await user.click(screen.getByRole('button',{name:'3페이지'}));
  expect(page).toHaveBeenCalledWith(3);
});
it('requires an action, confirmation step, and a nonblank letter before execution', async () => {
  const execute = jest.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();
  render(<CareExecuteModal open onClose={jest.fn()} target={target} partner={partner} onExecute={execute} executing={false} executeError={null} />);
  expect((screen.getByRole('button',{name:'다음'}) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole('radio',{name:'채팅방 개설'}));
  await user.click(screen.getByRole('button',{name:'다음'}));
  expect(execute).not.toHaveBeenCalled();
  expect((screen.getByRole('button',{name:'케어 실행',exact:true}) as HTMLButtonElement).disabled).toBe(true);
  await user.type(screen.getByRole('textbox',{name:/편지 내용/}),'확인한 편지');
  await user.click(screen.getByRole('button',{name:'케어 실행',exact:true}));
  expect(execute).toHaveBeenCalledWith('open_chat','확인한 편지');
});
it('keeps the modal and letter locked while the server is executing', async () => {
  const close = jest.fn();
  const user = userEvent.setup();
  const props = {open:true,onClose:close,target,partner,onExecute:jest.fn(),executing:false,executeError:null};
  const { rerender } = render(<CareExecuteModal {...props} />);
  await user.click(screen.getByRole('radio',{name:'좋아요',exact:true}));
  await user.click(screen.getByRole('button',{name:'다음'}));
  rerender(<CareExecuteModal {...props} executing />);
  await user.keyboard('{Escape}');
  expect(close).not.toHaveBeenCalled();
  expect((screen.getByRole('textbox',{name:/편지 내용/}) as HTMLTextAreaElement).disabled).toBe(true);
  expect((screen.getByRole('button',{name:'케어 실행 닫기'}) as HTMLButtonElement).disabled).toBe(true);
});
it.each(['pending','cared'] as const)('preserves target/partner/action payload and pending target ID for %s', async status => {
  (AdminService.care.getTargets as jest.Mock).mockResolvedValue({items:[{...target,status}], page:1, limit:20,total:1});
  const user = userEvent.setup();
  render(<CareV2 />);
  await user.click(await screen.findByRole('button',{name:/대상 일/}));
  await user.click(await screen.findByRole('button',{name:'파트너 일 선택'}));
  await user.click(screen.getByRole('radio',{name:'상호좋아요'}));
  await user.click(screen.getByRole('button',{name:'다음'}));
  await user.type(screen.getByRole('textbox',{name:/편지 내용/}),'운영자 편지');
  await user.click(screen.getByRole('button',{name:'케어 실행',exact:true}));
  await waitFor(() => expect(AdminService.care.execute).toHaveBeenCalledWith({targetUserId:'user-1',partnerUserId:'partner-1',action:'mutual_like',letterContent:'운영자 편지',careTargetId:status==='pending'?'target-1':undefined}));
});
it('ignores stale partner results after changing the selected target', async () => {
  let resolveOld!: (partners:CarePartner[]) => void;
  (AdminService.care.getTargets as jest.Mock).mockResolvedValue({items:[target,{...target,id:'target-2',user_id:'user-2',name:'대상 이'}],page:1,limit:20,total:2});
  (AdminService.care.getPartners as jest.Mock).mockImplementation((id:string) => id==='user-1'?new Promise(resolve => {resolveOld=resolve;}):Promise.resolve([{...partner,userId:'partner-2',name:'파트너 이'}]));
  const user = userEvent.setup();
  render(<CareV2 />);
  await user.click(await screen.findByRole('button',{name:/대상 일/}));
  await user.click(screen.getByRole('button',{name:/대상 이/}));
  await screen.findByRole('button',{name:'파트너 이 선택'});
  await act(async () => resolveOld([partner]));
  expect(screen.queryByRole('button',{name:'파트너 일 선택'})).toBeNull();
  expect(screen.getByRole('button',{name:'파트너 이 선택'})).toBeTruthy();
});

it('keeps log action filtering, debounced target search, paging, and the full letter accessible', async () => {
  const log = {id:'log-1',target_name:'대상 일',partner_name:'파트너 일',admin_name:'관리자',action:'like',letter_content:'전체 편지 내용을 확인합니다',created_at:'2026-10-01T00:00:00Z'};
  (AdminService.care.getLogs as jest.Mock).mockImplementation(({page}: {page:number}) => Promise.resolve({items:[log],page,limit:20,total:41}));
  const user = userEvent.setup();
  render(<CareLogsV2 />);
  await screen.findByText('대상 일');
  await user.click(screen.getByRole('button',{name:/액션 타입/}));
  await user.click(await screen.findByRole('option',{name:'좋아요'}));
  await waitFor(() => expect(AdminService.care.getLogs).toHaveBeenLastCalledWith({page:1,limit:20,action:'like'}));
  await user.type(screen.getByRole('textbox',{name:'대상 유저 ID 검색'}),'user-1');
  await waitFor(() => expect(AdminService.care.getLogs).toHaveBeenLastCalledWith({page:1,limit:20,action:'like',targetUserId:'user-1'}));
  await user.click(screen.getByRole('button',{name:'다음'}));
  await waitFor(() => expect(AdminService.care.getLogs).toHaveBeenLastCalledWith({page:2,limit:20,action:'like',targetUserId:'user-1'}));
  expect(screen.getByRole('button',{name:'대상 일 편지 내용'}).textContent).toBe('전체 편지 내용을 확인합니다');
});
