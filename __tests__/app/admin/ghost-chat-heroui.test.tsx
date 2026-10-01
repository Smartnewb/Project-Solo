import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GhostChatPanel from '@/app/admin/ghost-chat/components/GhostChatPanel';
import GhostChatStatusBar from '@/app/admin/ghost-chat/components/GhostChatStatusBar';
import GhostChatConfirmDialog from '@/app/admin/ghost-chat/components/GhostChatConfirmDialog';
import GhostContextPanel from '@/app/admin/ghost-chat/components/GhostContextPanel';
import {DEV_GHOST_CHAT_SESSIONS,getDevGhostChatContext,getDevGhostChatMessages} from '@/app/admin/ghost-chat/mock-data';
const session={...DEV_GHOST_CHAT_SESSIONS[0],adminMessageCount:0};
const context=getDevGhostChatContext(session.id);
const messages=getDevGhostChatMessages(session.id).messages;
function props(){return {session,context,messages,loading:false,messagesLoading:false,actionLoading:false,onSendMessage:jest.fn().mockResolvedValue(undefined),onClose:jest.fn().mockResolvedValue(undefined)};}
it('requires explicit first-message confirmation and preserves failed draft for retry',async()=>{
  const p=props();p.onSendMessage.mockRejectedValueOnce(new Error('전송 실패'));
  const user=userEvent.setup();render(<GhostChatPanel {...p}/>);
  await user.type(screen.getByRole('textbox',{name:'Ghost persona로 전송'}),'검수한 답장');
  await user.click(screen.getByRole('button',{name:'전송',exact:true}));
  expect(p.onSendMessage).not.toHaveBeenCalled();
  await user.click(within(screen.getByRole('dialog',{name:'Ghost 메시지 전송 확인'})).getByRole('button',{name:'취소'}));
  expect(p.onSendMessage).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:'전송',exact:true}));
  await user.click(within(screen.getByRole('dialog',{name:'Ghost 메시지 전송 확인'})).getByRole('button',{name:'전송'}));
  await screen.findByText('전송 실패');
  expect(p.onSendMessage).toHaveBeenCalledWith(session.id,'검수한 답장');
  expect((screen.getByRole('textbox',{name:'Ghost persona로 전송'}) as HTMLTextAreaElement).value).toBe('검수한 답장');
});
it('locks pending send, clears a changed session draft, and ignores the old completion',async()=>{
  let resolve!:()=>void;
  const p=props();p.session={...session,adminMessageCount:1};p.onSendMessage.mockImplementation(()=>new Promise<void>(r=>{resolve=r;}));
  const user=userEvent.setup();const view=render(<GhostChatPanel {...p}/>);
  await user.type(screen.getByRole('textbox',{name:'Ghost persona로 전송'}),'첫 상대 메시지');
  await user.click(screen.getByRole('button',{name:'전송',exact:true}));
  expect((screen.getByRole('textbox',{name:'Ghost persona로 전송'}) as HTMLTextAreaElement).disabled).toBe(true);
  view.rerender(<GhostChatPanel {...p} session={{...p.session,id:'session-two'}}/>);
  expect((screen.getByRole('textbox',{name:'Ghost persona로 전송'}) as HTMLTextAreaElement).value).toBe('');
  await act(async()=>resolve());
  await user.type(screen.getByRole('textbox',{name:'Ghost persona로 전송'}),'두번째 상대 메시지');
  expect(p.onSendMessage).toHaveBeenCalledTimes(1);
});
it('respects IME composition, Shift+Enter, and closed-session controls',async()=>{
  const p=props();p.session={...session,adminMessageCount:1};
  const view=render(<GhostChatPanel {...p}/>);const input=screen.getByRole('textbox',{name:'Ghost persona로 전송'});
  fireEvent.change(input,{target:{value:'작성 중'}});
  fireEvent.keyDown(input,{key:'Enter',isComposing:true});
  fireEvent.keyDown(input,{key:'Enter',shiftKey:true});
  expect(p.onSendMessage).not.toHaveBeenCalled();
  view.rerender(<GhostChatPanel {...p} session={{...session,state:'CLOSED'}}/>);
  expect((screen.getByRole('button',{name:'전송',exact:true}) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('button',{name:'종료',exact:true}) as HTMLButtonElement).disabled).toBe(true);
});
it('keeps confirmation locked during execution and reconnect action keyboard accessible',async()=>{
  const cancel=jest.fn(),confirm=jest.fn();const user=userEvent.setup();const view=render(<GhostChatConfirmDialog open title="대화 종료" description="종료 확인" confirmLabel="종료" loading onCancel={cancel} onConfirm={confirm}/>);
  await user.keyboard('{Escape}');expect(cancel).not.toHaveBeenCalled();
  expect((screen.getByRole('button',{name:'종료'}) as HTMLButtonElement).disabled).toBe(true);
  view.unmount();const reconnect=jest.fn();render(<GhostChatStatusBar pendingCount={1} activeCount={2} idleCount={3} closedCount={4} connectionState="error" lastEventAt={null} onReconnect={reconnect}/>);
  act(()=>screen.getByRole('button',{name:'재연결'}).focus());await user.keyboard('{Enter}');expect(reconnect).toHaveBeenCalledTimes(1);
});
it('preserves real operator profile and anonymous target visibility in context',()=>{
  render(<GhostContextPanel session={session} context={context}/>);
  expect(screen.getByText(context!.ghost.name)).toBeTruthy();
  expect(screen.getByRole('link',{name:'Ghost 프로필 확인'}).getAttribute('href')).toBe(`/admin/ai-profiles/ghosts?ghostAccountId=${encodeURIComponent(session.ghostAccountId)}`);
  expect(screen.getByText(context!.visibility.targetSeesGhostName)).toBeTruthy();
});

it('reports a failed close outside the dismissed confirmation and allows retry',async()=>{
  const p=props();p.onClose.mockRejectedValueOnce(new Error('종료 실패'));
  const user=userEvent.setup();render(<GhostChatPanel {...p}/>);
  await user.click(screen.getByRole('button',{name:'종료',exact:true}));
  expect(p.onClose).not.toHaveBeenCalled();
  await user.click(within(screen.getByRole('dialog',{name:'대화 종료'})).getByRole('button',{name:'종료',exact:true}));
  await screen.findByText('종료 실패');
  expect(screen.queryByRole('dialog',{name:'대화 종료'})).toBeNull();
  expect(p.onClose).toHaveBeenCalledWith(session.id);
  expect((screen.getByRole('button',{name:'종료',exact:true}) as HTMLButtonElement).disabled).toBe(false);
});
