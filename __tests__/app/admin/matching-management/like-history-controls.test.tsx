import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
const mockGet=jest.fn();
jest.mock('@/app/services/admin',()=>({__esModule:true,default:{matching:{getLikeHistory:(...args:unknown[])=>mockGet(...args)}}}));
jest.mock('@/components/admin/appearance/UserDetailModal',()=>({__esModule:true,default:()=>null}));
import LikeHistory from '@/app/admin/matching-management/components/LikeHistory';
it('preserves calendar dates, trimmed name and one-based history pagination',async()=>{
 mockGet.mockResolvedValue({items:[],pagination:{totalItems:30,totalPages:3}});render(<LikeHistory />);
 fireEvent.change(screen.getByLabelText('시작일'),{target:{value:'2026-10-01'}});fireEvent.change(screen.getByLabelText('종료일'),{target:{value:'2026-10-02'}});fireEvent.change(screen.getByLabelText('이름 검색'),{target:{value:' 홍길동 '}});
 fireEvent.click(screen.getByRole('button',{name:'조회'}));await waitFor(()=>expect(mockGet).toHaveBeenCalledWith('2026-10-01','2026-10-02',1,10,'홍길동'));
 fireEvent.click(await screen.findByRole('button',{name:'다음'}));await waitFor(()=>expect(mockGet).toHaveBeenLastCalledWith('2026-10-01','2026-10-02',2,10,'홍길동'));
});
import MatcherHistory from '@/app/admin/matching-management/components/MatcherHistory';
import type {UserSearchResult} from '@/app/admin/matching-management/types';
it('keeps searched-user selection actionable',()=>{
 const user={id:'u',name:'홍길동',age:25,gender:'MALE'} as UserSearchResult;const select=jest.fn();
 render(<MatcherHistory searchTerm="홍길동" searchLoading={false} error={null} searchResults={[user]} selectedUser={null} setSearchTerm={jest.fn()} searchUsers={jest.fn()} handleUserSelect={select}/>);
 fireEvent.click(screen.getByRole('button',{name:'홍길동 (25세, 남)'}));expect(select).toHaveBeenCalledWith(user);
});
