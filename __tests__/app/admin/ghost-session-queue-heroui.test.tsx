import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GhostSessionQueue from '@/app/admin/ghost-chat/components/GhostSessionQueue';
import {DEV_GHOST_CHAT_SESSIONS} from '@/app/admin/ghost-chat/mock-data';
import type {GhostChatSession} from '@/app/types/ghost-chat';
it('sorts open sessions by activity, filters target type and selects with keyboard',async()=>{
 const sessions:GhostChatSession[]=[
  {...DEV_GHOST_CHAT_SESSIONS[0],id:'female',targetUserType:'REAL_FEMALE',createdAt:'2026-10-01',updatedAt:'2026-10-01',lastUserMessageAt:'2026-10-01',lastAdminMessageAt:null,firstUserMessageAt:null},
  {...DEV_GHOST_CHAT_SESSIONS[0],id:'ghost',targetUserType:'GHOST',createdAt:'2026-10-02',updatedAt:'2026-10-02',lastUserMessageAt:null,lastAdminMessageAt:'2026-10-02',firstUserMessageAt:null},
  {...DEV_GHOST_CHAT_SESSIONS[0],id:'closed',state:'CLOSED'},
 ];
 const select=jest.fn(),user=userEvent.setup();render(<GhostSessionQueue sessions={sessions} selectedSessionId="ghost" newSessionIds={new Set(['female'])} unreadMap={{female:3}} onSelectSession={select} variant="grid" getTargetProfilePreview={id=>({name:id,subtitle:'대학'})}/>);
 expect(screen.getAllByRole('button',{name:/채팅 열기/}).map(el=>el.getAttribute('aria-label'))).toEqual(['ghost 채팅 열기','female 채팅 열기']);
 expect(screen.queryByRole('button',{name:'closed 채팅 열기'})).toBeNull();
 expect(screen.getByLabelText('읽지 않은 메시지 3개')).toBeTruthy();
 await user.click(screen.getByRole('button',{name:'실 여성 유저 채팅방'}));
 expect(screen.queryByRole('button',{name:'ghost 채팅 열기'})).toBeNull();
 const button=screen.getByRole('button',{name:'female 채팅 열기'});act(()=>button.focus());await user.keyboard('{Enter}');expect(select).toHaveBeenCalledWith('female');
 await user.click(screen.getByRole('button',{name:'고스트 유저 채팅방'}));
 expect(screen.getByRole('button',{name:'ghost 채팅 열기'}).getAttribute('aria-pressed')).toBe('true');
});
