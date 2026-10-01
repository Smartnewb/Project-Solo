import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GhostChatV2 from '@/app/admin/ghost-chat/ghost-chat-v2';
import {useGhostChatSessions} from '@/app/admin/ghost-chat/hooks/useGhostChatSessions';
import {DEV_GHOST_CHAT_SESSIONS,getDevGhostChatContext,getDevGhostChatMessages} from '@/app/admin/ghost-chat/mock-data';
const replace=jest.fn(),select=jest.fn().mockResolvedValue(undefined),clear=jest.fn(),info=jest.fn();
const router={replace};
const params=new URLSearchParams();
jest.mock('next/navigation',()=>({useRouter:()=>router,useSearchParams:()=>params}));
jest.mock('@/shared/ui/admin/toast/toast-context',()=>({useToast:()=>toast}));
const toast={info};
jest.mock('@/app/admin/ghost-chat/hooks/useGhostChatSessions',()=>({useGhostChatSessions:jest.fn()}));
jest.mock('@/app/admin/ghost-chat/components/GhostSessionQueue',()=>function Queue(props:{onSelectSession:(id:string)=>void}){return <button onClick={()=>props.onSelectSession('session/two')}>테스트 세션 선택</button>;});
const session=DEV_GHOST_CHAT_SESSIONS[0];
beforeEach(()=>{
 jest.clearAllMocks(); params.delete('session');params.delete('ghostAccountId');
 Object.defineProperty(window,'matchMedia',{writable:true,value:jest.fn(()=>({matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()}))});
 (useGhostChatSessions as jest.Mock).mockReturnValue({sessions:[session],selectedSession:session,selectedContext:getDevGhostChatContext(session.id),selectedMessages:getDevGhostChatMessages(session.id).messages,contextMap:{},previewMessageMap:{},loading:false,messagesLoading:false,error:null,newSessionIds:new Set(),unreadMap:{},statusCounts:{pending:0,active:1,idle:0,closed:0},actionLoadingId:null,selectSession:select,sendMessage:jest.fn(),closeSession:jest.fn(),clearSelectedSession:clear,events:{state:'connected',lastEventAt:null,reconnect:jest.fn()},usingDevMocks:false});
});
it('preserves encoded profile-scoped session navigation and desktop panel controls',async()=>{
 params.set('ghostAccountId','ghost/account');const user=userEvent.setup();render(<GhostChatV2/>);
 await user.click(screen.getByRole('button',{name:'우측 상세 패널 닫기'}));
 expect(screen.queryByRole('heading',{name:'현재 열린 채팅'})).toBeNull();
 await user.click(screen.getByRole('button',{name:'우측 패널 열기'}));
 expect(screen.getByRole('heading',{name:'현재 열린 채팅'})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'테스트 세션 선택'}));
 expect(select).toHaveBeenCalledWith('session/two');
 expect(replace).toHaveBeenCalledWith('/admin/ghost-chat?session=session%2Ftwo&ghostAccountId=ghost%2Faccount',{scroll:false});
});
it('opens and closes the actual HeroUI fullscreen modal',async()=>{
 const user=userEvent.setup();render(<GhostChatV2/>);
 await user.click(screen.getByRole('button',{name:'전체 화면에서 대응'}));
 expect(screen.getByRole('dialog',{name:'Ghost Chat 전체 대응'})).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'전체 화면 닫기'}));
 expect(screen.queryByRole('dialog',{name:'Ghost Chat 전체 대응'})).toBeNull();
});
it('opens deep-linked mobile chat and returns to the scoped queue',async()=>{
 (window.matchMedia as jest.Mock).mockReturnValue({matches:true,addEventListener:jest.fn(),removeEventListener:jest.fn()});
 params.set('session',session.id);params.set('ghostAccountId','account-1');const user=userEvent.setup();render(<GhostChatV2/>);
 expect(select).toHaveBeenCalledWith(session.id);
 await user.click(await screen.findByRole('button',{name:'목록으로 돌아가기'}));
 expect(clear).toHaveBeenCalledTimes(1);
 expect(replace).toHaveBeenCalledWith('/admin/ghost-chat?ghostAccountId=account-1',{scroll:false});
 expect(screen.getByRole('button',{name:'테스트 세션 선택'})).toBeTruthy();
});
