import {selectHeroValue,heroSelectTrigger} from '@/app/admin/content/test-utils/hero-select';
import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
const mockCreate=jest.fn(),mockUpdate=jest.fn(),mockPush=jest.fn();
jest.mock('next/navigation',()=>({useRouter:()=>({push:mockPush})}));
jest.mock('@/shared/ui/admin/toast',()=>({useToast:()=>({success:jest.fn(),error:jest.fn()})}));
jest.mock('@/app/services/admin',()=>({__esModule:true,countriesForScope:(scope:string)=>scope==='both'?['kr','jp']:[scope],default:{pushGroups:{
 create:(...args:unknown[])=>mockCreate(...args),update:(...args:unknown[])=>mockUpdate(...args),
 get:async()=>({name:'양국 그룹',type:'static',countryScope:'both'}),
 members:async()=>({kr:[{id:'shared-id',name:'KR 유저',phoneNumber:'01012345678'}],jp:[{id:'shared-id',name:'JP 유저',phoneNumber:'09012345678'}]}),filterUsers:jest.fn(),
}}}));
import GroupFormClient from '@/app/admin/push-groups/group-form-client';
const animationDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'getAnimations');
beforeAll(() => Object.defineProperty(Element.prototype, 'getAnimations', {configurable:true,value:() => []}));
afterAll(() => { if (animationDescriptor) Object.defineProperty(Element.prototype, 'getAnimations', animationDescriptor); else delete (Element.prototype as Partial<Element>).getAnimations; });
beforeEach(()=>jest.clearAllMocks());
it('preserves selected JP scope and dynamic gender payload without user lists',async()=>{
 render(<GroupFormClient />);
 fireEvent.change(screen.getByLabelText('그룹명'),{target:{value:'JP dynamic'}});
 await selectHeroValue('국가 범위','jp');
 await selectHeroValue('그룹 타입','dynamic');
 await selectHeroValue('성별','FEMALE');
 fireEvent.click(screen.getByRole('button',{name:'저장'}));
 await waitFor(()=>expect(mockCreate).toHaveBeenCalledWith({name:'JP dynamic',description:undefined,countryScope:'jp',type:'dynamic',filterCriteria:{gender:'FEMALE'}}));
 expect(mockCreate.mock.calls[0][0]).not.toHaveProperty('staticUserIds');
});
it('real HeroUI tabs remove a JP selection without removing the identical KR identifier',async()=>{
 render(<GroupFormClient groupId="group" />);
 await screen.findByLabelText('그룹명');
 fireEvent.click(screen.getByRole('tab',{name:'JP 담기 (1)'}));
 expect(screen.getByText('JP 유저')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'선택된 유저 제거'}));
 fireEvent.click(screen.getByRole('button',{name:'저장'}));
 await waitFor(()=>expect(mockUpdate).toHaveBeenCalledWith('group',expect.objectContaining({countryScope:'both',staticUserIds:{kr:['shared-id']}})));
});
