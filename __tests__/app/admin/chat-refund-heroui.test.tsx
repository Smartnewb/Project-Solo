import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatRefundTab from '@/app/admin/chat/components/ChatRefundTab';
import AdminService from '@/app/services/admin';

jest.mock('@/app/services/admin',()=>({__esModule:true,default:{chatRefund:{searchUsers:jest.fn(),getEligibleRooms:jest.fn(),previewRefund:jest.fn(),processRefund:jest.fn()}}}));
const api=AdminService.chatRefund;
const room={chatRoomId:'room-1',partnerInfo:{name:'상대 일',university:'대학'},createdAt:'2026-10-01',totalMessageCount:2,isRefunded:false};
beforeEach(()=>{
  jest.clearAllMocks();
  (api.searchUsers as jest.Mock).mockResolvedValue({users:[{userId:'user-1',name:'대상 일',phoneNumber:'01012345678'}]});
  (api.getEligibleRooms as jest.Mock).mockResolvedValue({eligibleRooms:[room]});
  (api.previewRefund as jest.Mock).mockResolvedValue({userName:'대상 일',phoneNumber:'01012345678',refundGemAmount:5,smsContent:'초기 문자',refundReasonText:'답장 없음',refundReasonCode:'A'});
  (api.processRefund as jest.Mock).mockResolvedValue({success:true});
});
async function openPreview(user:ReturnType<typeof userEvent.setup>){
  await user.type(screen.getByRole('textbox',{name:'사용자 이름'}),' 대상 {Enter}');
  await user.click(await screen.findByRole('button',{name:'대상 일 선택'}));
  await user.click(await screen.findByRole('button',{name:'상대 일 채팅방 환불하기'}));
  await user.click(screen.getByRole('radio',{name:'프로필을 다시 보니 생각보다 관심이 안갔어요'}));
  await user.click(screen.getByRole('button',{name:'다음'}));
  await screen.findByRole('textbox',{name:'SMS 내용'});
}
it('requires reason and SMS confirmation, preserves the payload, and removes the processed room',async()=>{
  const user=userEvent.setup();render(<ChatRefundTab />);await openPreview(user);
  expect(api.searchUsers).toHaveBeenCalledWith('대상');
  expect(api.previewRefund).toHaveBeenCalledWith({userId:'user-1',chatRoomId:'room-1',refundReasonCode:'D'});
  expect(api.processRefund).not.toHaveBeenCalled();
  await user.clear(screen.getByRole('textbox',{name:'SMS 내용'}));
  await user.type(screen.getByRole('textbox',{name:'SMS 내용'}),'변경한 문자');
  await user.click(screen.getByRole('button',{name:'환불 처리',exact:true}));
  await waitFor(()=>expect(api.processRefund).toHaveBeenCalledWith({userId:'user-1',chatRoomId:'room-1',refundReasonCode:'D',smsContent:'변경한 문자'}));
  await screen.findByText('환불이 성공적으로 처리되었습니다.');
  expect(screen.queryByRole('button',{name:'상대 일 채팅방 환불하기'})).toBeNull();
});
it('locks dismiss, editable SMS and target changes while refund is pending',async()=>{
  let resolve!: (result:unknown)=>void;
  (api.processRefund as jest.Mock).mockImplementation(()=>new Promise(r=>{resolve=r;}));
  const user=userEvent.setup();render(<ChatRefundTab />);await openPreview(user);
  await user.click(screen.getByRole('button',{name:'환불 처리',exact:true}));
  await user.keyboard('{Escape}');
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect((screen.getByRole('textbox',{name:'SMS 내용'}) as HTMLTextAreaElement).disabled).toBe(true);
  expect((screen.getByRole('button',{name:'환불 미리보기 닫기'}) as HTMLButtonElement).disabled).toBe(true);
  await act(async()=>resolve({success:true,smsError:'발송 오류'}));
  await screen.findByText('환불 처리는 완료되었으나 SMS 발송에 실패했습니다: 발송 오류');
  expect(api.processRefund).toHaveBeenCalledTimes(1);
});
it('closes a conflicting refund preview and removes the already refunded room',async()=>{
  (api.processRefund as jest.Mock).mockRejectedValue({response:{status:409,data:{message:'이미 환불됨'}}});
  const user=userEvent.setup();render(<ChatRefundTab />);await openPreview(user);
  await user.click(screen.getByRole('button',{name:'환불 처리',exact:true}));
  await screen.findByText('이미 환불됨');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('button',{name:'상대 일 채팅방 환불하기'})).toBeNull();
});
