import {selectHeroValue} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
const stats=jest.fn(),jobs=jest.fn(),create=jest.fn();
const mockConfirm=jest.fn(),mockToast={success:jest.fn(),error:jest.fn(),warning:jest.fn(),info:jest.fn()};
jest.mock('@/shared/ui/admin/confirm-dialog',()=>({useConfirm:()=>mockConfirm}));
jest.mock('@/shared/ui/admin/toast',()=>({useToast:()=>mockToast}));
jest.mock('@/app/services/admin/community-automation',()=>({reviewSources:{stats:(...a:unknown[])=>stats(...a),listPostJobs:(...a:unknown[])=>jobs(...a),createPostJob:(...a:unknown[])=>create(...a)}}));
import Page from '@/app/admin/community-automation/review-posts/page';
it('retains multiple-source arrays, trimmed seed and local schedule through validation controls',async()=>{
 const user=userEvent.setup();stats.mockResolvedValue([]);jobs.mockResolvedValue([]);create.mockResolvedValue({scheduledAt:'2026-12-12T03:00:00Z'});render(<Page/>);
 await screen.findByRole('button',{name:/원본$/});await selectHeroValue('원본','APP_STORE');await selectHeroValue('원본','YEONPICK');fireEvent.change(screen.getByLabelText('리뷰 글 방향'),{target:{value:' 학생 소개팅 후기 '}});fireEvent.change(screen.getByLabelText('발행 예약 시간'),{target:{value:'2026-12-12T12:00'}});fireEvent.click(screen.getByRole('button',{name:'예약 생성'}));
 await waitFor(()=>expect(create).toHaveBeenCalledWith({seedText:'학생 소개팅 후기',sourceTypes:['PLAY_STORE'],minRating:4,scheduledAt:new Date('2026-12-12T12:00').toISOString()}));
});
