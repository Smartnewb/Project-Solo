import {selectHeroValue} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
const mockList=jest.fn(),mockCreate=jest.fn(),mockExecute=jest.fn(),mockCancel=jest.fn(),mockValidate=jest.fn();
jest.mock('@/app/admin/scheduled-matching/service',()=>({scheduledMatchingService:{getManualMatchingList:(...args:unknown[])=>mockList(...args),createManualMatching:(...args:unknown[])=>mockCreate(...args),executeManualMatching:(...args:unknown[])=>mockExecute(...args),cancelManualMatching:(...args:unknown[])=>mockCancel(...args),validateManualMatching:(...args:unknown[])=>mockValidate(...args)}}));
jest.mock('@/shared/ui/admin/toast',()=>({useToast:()=>({success:jest.fn(),error:jest.fn(),warning:jest.fn(),info:jest.fn()})}));
import ManualMatching from '@/app/admin/scheduled-matching/components/ManualMatching';
const matching={id:'job',status:'scheduled',matchType:'cs_support',users:[{id:'kr-user',name:'KR',gender:'MALE'},{id:'jp-user',name:'JP',gender:'FEMALE'}],scheduledAt:'2026-10-12T03:00:00Z',reason:'CS 지원',createdBy:{name:'admin'},createdAt:'2026-10-02T03:00:00Z'};
beforeEach(()=>{jest.clearAllMocks();mockList.mockResolvedValue({data:[matching],pagination:{total:30}});});
it('executes only after explicit confirmation in the real HeroUI modal',async()=>{
 render(<ManualMatching />);fireEvent.click(await screen.findByRole('button',{name:'수동 매칭 즉시 실행'}));
 expect(mockExecute).not.toHaveBeenCalled();expect(screen.getByRole('dialog',{name:'수동 매칭 즉시 실행'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'즉시 실행',exact:true}));await waitFor(()=>expect(mockExecute).toHaveBeenCalledWith('job'));
});
it('requires cancellation reason and preserves filters and pagination',async()=>{
 render(<ManualMatching />);fireEvent.click(await screen.findByRole('button',{name:'수동 매칭 취소'}));
 expect(screen.getByRole('button',{name:'취소 확인'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('취소 사유'),{target:{value:' 운영 요청 '}});fireEvent.click(screen.getByRole('button',{name:'취소 확인'}));
 await waitFor(()=>expect(mockCancel).toHaveBeenCalledWith('job','운영 요청'));
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
 await selectHeroValue('상태','failed');
 await waitFor(()=>expect(mockList).toHaveBeenLastCalledWith({page:1,limit:10,status:'failed'}));
 fireEvent.click(screen.getByRole('button',{name:'다음'}));await waitFor(()=>expect(mockList).toHaveBeenLastCalledWith({page:2,limit:10,status:'failed'}));
});
it('preserves creation IDs, local datetime to ISO, notification and skip validation fields',async()=>{
 render(<ManualMatching />);await screen.findByRole('button',{name:'수동 매칭 상세 보기'});
 fireEvent.change(screen.getByLabelText('유저 1 ID'),{target:{value:' kr-user '}});fireEvent.change(screen.getByLabelText('유저 2 ID'),{target:{value:' jp-user '}});
 fireEvent.change(screen.getByLabelText('매칭 예정 시간'),{target:{value:'2026-10-12T12:00'}});fireEvent.change(screen.getByLabelText('매칭 사유'),{target:{value:' CS 지원 '}});
 await selectHeroValue('우선순위','high');fireEvent.click(screen.getByRole('button',{name:'매칭 생성'}));
 await waitFor(()=>expect(mockCreate).toHaveBeenCalledWith({userIds:['kr-user','jp-user'],scheduledAt:new Date('2026-10-12T12:00').toISOString(),matchType:'cs_support',reason:'CS 지원',priority:'high',notifyUsers:true,skipValidation:false}));
});
