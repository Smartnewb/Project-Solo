import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MatchingSimulation from '@/app/admin/matching-management/components/MatchingSimulation';
import UnmatchedUsers from '@/app/admin/matching-management/components/UnmatchedUsers';
it('simulation partner is keyboard selectable through an actual button',async()=>{
 const select=jest.fn();const partner={profile:{id:'p',name:'후보',age:25,gender:'MALE',rank:'A',profileImages:[],preferences:[]},similarity:0.8};
 const result={success:true,message:'완료',selectedPartner:partner,potentialPartners:[partner]} as unknown as React.ComponentProps<typeof MatchingSimulation>['simulationResult'];
 render(<MatchingSimulation selectedUser={null} simulationLoading={false} simulationResult={result} matchLimit={10} selectedPartnerIndex={null} setMatchLimit={jest.fn()} runMatchingSimulation={jest.fn()} handlePartnerSelect={select}/>);
 screen.getByRole('button',{name:'후보'}).focus();await userEvent.keyboard('{Enter}');expect(select).toHaveBeenCalledWith(0);
});
it('unmatched detail selection and execute stay separate actions',async()=>{
 const select=jest.fn(),execute=jest.fn();const user={id:'u',name:'대기 사용자',age:25,gender:'MALE'} as React.ComponentProps<typeof UnmatchedUsers>['unmatchedUsers'][number];
 render(<UnmatchedUsers unmatchedUsers={[user]} unmatchedUsersLoading={false} unmatchedUsersError={null} unmatchedUsersTotalCount={1} unmatchedUsersPage={0} unmatchedUsersLimit={20} unmatchedUsersSearchTerm="" unmatchedUsersGenderFilter="" selectedUnmatchedUser={null} setUnmatchedUsersSearchTerm={jest.fn()} setUnmatchedUsersGenderFilter={jest.fn()} handleUnmatchedUsersSearch={jest.fn()} handleUnmatchedUsersPageChange={jest.fn()} handleUnmatchedUsersLimitChange={jest.fn()} handleUnmatchedUserSelect={select} processUnmatchedUserMatching={execute} fetchUnmatchedUsers={jest.fn()}/>);
 screen.getByRole('button',{name:'대기 사용자'}).focus();await userEvent.keyboard('{Enter}');expect(select).toHaveBeenCalledWith(user);expect(execute).not.toHaveBeenCalled();
 select.mockClear();fireEvent.click(screen.getByRole('button',{name:'매칭 실행'}));expect(select).toHaveBeenCalledTimes(1);expect(execute).toHaveBeenCalledTimes(1);
});
