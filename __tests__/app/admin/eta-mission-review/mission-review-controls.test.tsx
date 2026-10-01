import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
const mockList=jest.fn(),mockApprove=jest.fn(),mockReject=jest.fn(),mockSuccess=jest.fn();
jest.mock('@/app/services/admin',()=>({__esModule:true,default:{etaMission:{getSubmissions:(...a:unknown[])=>mockList(...a),approve:(...a:unknown[])=>mockApprove(...a),reject:(...a:unknown[])=>mockReject(...a)}}}));
jest.mock('@/shared/ui/admin/toast/toast-context',()=>({useToast:()=>({success:mockSuccess,error:jest.fn()})}));
import Page from '@/app/admin/eta-mission-review/page';
const original=Object.getOwnPropertyDescriptor(Element.prototype,'getAnimations');beforeAll(()=>Object.defineProperty(Element.prototype,'getAnimations',{configurable:true,value:()=>[]}));afterAll(()=>{if(original)Object.defineProperty(Element.prototype,'getAnimations',original);else delete (Element.prototype as unknown as Record<string,unknown>).getAnimations;});
beforeEach(()=>{jest.clearAllMocks();mockList.mockResolvedValue({items:[{id:'mission',name:'학생',schoolName:'학교',status:'pending',screenshotUrl:'https://example.com/shot.png',submittedAt:'2026-10-02T03:00:00Z'}],total:60});mockApprove.mockResolvedValue({gemsAwarded:20});mockReject.mockResolvedValue(undefined);});
it('requires explicit reject confirmation with trimmed reason and preserves page sizes',async()=>{
 render(<Page/>);fireEvent.click(await screen.findByRole('button',{name:'거절',exact:true}));expect(mockReject).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'거절하기'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('거절 사유 (직접 입력 가능)'),{target:{value:' 홍보 문구 누락 '}});fireEvent.click(screen.getByRole('button',{name:'거절하기'}));await waitFor(()=>expect(mockReject).toHaveBeenCalledWith('mission','홍보 문구 누락'));
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());fireEvent.click(screen.getByRole('button',{name:'다음'}));await waitFor(()=>expect(mockList).toHaveBeenLastCalledWith('pending',2,20));
 await selectHeroValue('페이지당 행 수','50');await waitFor(()=>expect(mockList).toHaveBeenLastCalledWith('pending',1,50));
});
it('retains approval reward feedback and keyboard tab selection',async()=>{
 const user=userEvent.setup();render(<Page/>);await user.click(await screen.findByRole('button',{name:'승인',exact:true}));await waitFor(()=>expect(mockApprove).toHaveBeenCalledWith('mission'));expect(mockSuccess).toHaveBeenCalledWith('승인 완료 — 구슬 20개 지급');
 await waitFor(()=>expect(screen.getByRole('tab',{name:'대기'})).toBeEnabled());act(()=>screen.getByRole('tab',{name:'대기'}).focus());await user.keyboard('{ArrowRight}');await waitFor(()=>expect(mockList).toHaveBeenLastCalledWith('approved',1,20));
});
