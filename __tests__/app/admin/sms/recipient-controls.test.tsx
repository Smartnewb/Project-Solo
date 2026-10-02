import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
const mockCount=jest.fn(()=>({data:{validPhone:3,totalMatched:5,smsConsented:4,estimatedCost:{sms:60,lms:120}},isLoading:false}));
jest.mock('@/app/admin/sms/hooks/useRegions',()=>({useRegions:()=>({data:[{code:'seoul',name:'서울'},{code:'tokyo',name:'도쿄'}]}),useUniversitiesByRegions:()=>({data:[{id:'school',name:'서울대학교'}]})}));
jest.mock('@/app/admin/sms/hooks/useRecipientCount',()=>({useRecipientCount:(...args:unknown[])=>mockCount(...args as [])}));
jest.mock('@/app/admin/sms/hooks/useUserSearch',()=>({useUserSearch:()=>({data:{data:[{id:'u1',name:'홍길동',phoneNumber:'01012345678',gender:'MALE'}]},isLoading:false,isError:false})}));
jest.mock('@/shared/ui/admin/confirm-dialog',()=>({useConfirm:()=>jest.fn().mockResolvedValue(false)}));
jest.mock('@/shared/ui/admin/toast',()=>({useToast:()=>({success:jest.fn(),error:jest.fn(),warning:jest.fn(),info:jest.fn()})}));
import {MessageComposer} from '@/app/admin/sms/components/MessageComposer';
import {RecipientSelector} from '@/app/admin/sms/components/RecipientSelector';
import {UserSearchSelector} from '@/app/admin/sms/components/UserSearchSelector';
import {SendConfirmModal} from '@/app/admin/sms/components/SendConfirmModal';

it('uses searchable real HeroUI ComboBox for regions and enables schools after selection',async()=>{
 const change=jest.fn();render(<RecipientSelector onFilterChange={change} />);
 expect(screen.getByRole('combobox',{name:'학교'})).toBeDisabled();
 const region=screen.getByRole('combobox',{name:'지역'});
 fireEvent.change(region,{target:{value:'서울'}});fireEvent.click(screen.getByRole('button',{name:/지역 목록/}));
 fireEvent.click(await screen.findByRole('option',{name:'서울'}));
 fireEvent.keyDown(region,{key:'Escape'});
 await waitFor(()=>expect(screen.getByRole('combobox',{name:'학교'})).not.toBeDisabled());
 await waitFor(()=>expect(change).toHaveBeenLastCalledWith(expect.objectContaining({regionCodes:['seoul']}),3));
 fireEvent.click(screen.getByRole('button',{name:'서울 선택 해제'}));
 await waitFor(()=>expect(screen.getByRole('combobox',{name:'학교'})).toBeDisabled());
});
it('keeps direct-user search selection and removal without sends',async()=>{
 const change=jest.fn();const {rerender}=render(<UserSearchSelector selectedUserIds={[]} onSelectionChange={change} />);
 fireEvent.change(screen.getByLabelText('이름 또는 휴대폰 검색'),{target:{value:'홍길'}});
 fireEvent.click(screen.getByRole('checkbox'));
 expect(change).toHaveBeenCalledWith(['u1']);
 rerender(<UserSearchSelector selectedUserIds={['u1']} onSelectionChange={change} />);
 fireEvent.click(screen.getByRole('button',{name:'선택 해제'}));expect(change).toHaveBeenLastCalledWith([]);
});
it('SMS confirmation displays chosen users and confirms only after explicit click',()=>{
 const confirm=jest.fn(),close=jest.fn();render(<SendConfirmModal open filter={{userIds:['u1']}} count={{validPhone:1,totalMatched:1,smsConsented:1,excludedUsers:[],estimatedCost:{sms:20,lms:40}}} message="테스트 메시지" type="SMS" regions={[]} universities={[]} onClose={close} onConfirm={confirm} />);
 expect(screen.getByRole('dialog',{name:'발송 확인'})).toBeInTheDocument();expect(confirm).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'지금 발송'}));expect(confirm).toHaveBeenCalledTimes(1);
});

it('SMS composer exposes an associated accessible message name',()=>{
 const change=jest.fn();render(<MessageComposer onMessageChange={change}/>);fireEvent.change(screen.getByRole('textbox',{name:'메시지 내용'}),{target:{value:'안내 문구'}});expect(change).toHaveBeenLastCalledWith('안내 문구');
});
