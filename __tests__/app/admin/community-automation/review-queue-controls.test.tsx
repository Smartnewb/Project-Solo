import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
const mockList=jest.fn(),mockBulk=jest.fn(),mockRegenerate=jest.fn();
const mockConfirm=jest.fn(),mockToast={success:jest.fn(),error:jest.fn(),warning:jest.fn(),info:jest.fn()};
jest.mock('@/shared/ui/admin/confirm-dialog',()=>({useConfirm:()=>mockConfirm}));
jest.mock('@/shared/ui/admin/toast',()=>({useToast:()=>mockToast}));
jest.mock('@/app/services/admin/community-automation',()=>({reviewQueue:{list:(...a:unknown[])=>mockList(...a),bulk:(...a:unknown[])=>mockBulk(...a),regenerate:(...a:unknown[])=>mockRegenerate(...a)}}));
import Page from '@/app/admin/community-automation/review-queue/page';
beforeEach(()=>{jest.clearAllMocks();mockConfirm.mockResolvedValue(true);mockList.mockResolvedValue([{id:'content',status:'pending_review',generatedText:'검수 내용',createdAt:'2026-10-02T03:00:00Z'}]);mockBulk.mockResolvedValue({succeeded:['content'],failed:[]});});
it('preserves selected IDs and bulk action payload without real publishing',async()=>{
 render(<Page/>);fireEvent.click(await screen.findByRole('checkbox',{name:'content 선택'}));await selectHeroValue('일괄 액션','reject');fireEvent.click(screen.getByRole('button',{name:'실행'}));await waitFor(()=>expect(mockBulk).toHaveBeenCalledWith({contentIds:['content'],action:'reject'}));expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({message:expect.stringContaining('1개'),severity:'error'}));expect(mockToast.success).toHaveBeenCalledWith('완료: 1개, 실패: 0개');
});
it('does not run bulk action when confirmation is cancelled',async()=>{
 mockConfirm.mockResolvedValue(false);render(<Page/>);fireEvent.click(await screen.findByRole('checkbox',{name:'content 선택'}));fireEvent.click(screen.getByRole('button',{name:'실행'}));await waitFor(()=>expect(mockConfirm).toHaveBeenCalled());expect(mockBulk).not.toHaveBeenCalled();
});
it('runs regeneration only after confirmation',async()=>{
 render(<Page/>);fireEvent.click(await screen.findByRole('button',{name:'재생성'}));expect(mockRegenerate).not.toHaveBeenCalled();expect(screen.getByRole('dialog',{name:'재생성 확인'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'확인'}));await waitFor(()=>expect(mockRegenerate).toHaveBeenCalledWith('content'));
});
