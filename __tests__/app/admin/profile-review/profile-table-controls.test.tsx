import {heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import {fireEvent,render,screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import UserTableList from '@/app/admin/profile-review/components/UserTableList';
import type {PendingUser} from '@/app/admin/profile-review/page';
it('preserves row selection, bulk selection, skip isolation and one-based paging',async()=>{
 const user={id:'record',userId:'user',name:'홍길동',age:25,gender:'MALE',createdAt:'2026-10-02T03:00:00Z',pendingImages:[],approvedImageUrls:[]} as unknown as PendingUser;
 const select=jest.fn(),check=jest.fn(),all=jest.fn(),skip=jest.fn(),page=jest.fn();render(<UserTableList users={[user]} selectedUser={null} onUserSelect={select} onSkipUser={skip} pagination={{page:1,limit:20,total:30,hasMore:true}} onPageChange={page} searchTerm="" selectedUserIds={[]} onUserCheck={check} onSelectAllCheck={all}/>);
 fireEvent.click(screen.getByRole('checkbox',{name:'홍길동 선택'}));expect(check).toHaveBeenCalledWith('user',true);expect(select).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('checkbox',{name:'현재 페이지 전체 선택'}));expect(all).toHaveBeenCalledWith(true);
 fireEvent.click(screen.getByRole('button',{name:'홍길동 건너뛰기'}));expect(skip).toHaveBeenCalledWith('user');expect(select).not.toHaveBeenCalled();
 screen.getByRole('button',{name:'홍길동'}).focus();await userEvent.keyboard('{Enter}');expect(select).toHaveBeenCalledWith(user);fireEvent.click(screen.getByRole('button',{name:'다음'}));expect(page).toHaveBeenCalledWith(2);
 expect(heroSelectTrigger('페이지당 행 수')).toHaveTextContent('20');expect(heroSelectTrigger('페이지당 행 수')).toBeDisabled();
});
