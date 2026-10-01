import React from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import ChatPanel from '@/app/admin/support-chat/components/ChatPanel';
import ChatDetailDialog from '@/app/admin/support-chat/components/ChatDetailDialog';
import { useReadState } from '@/app/admin/support-chat/lib/read-state';
import { useSupportChatSocket } from '@/app/admin/support-chat/hooks/useSupportChatSocket';
import service from '@/app/services/support-chat';
import type { SupportSessionDetail } from '@/app/types/support-chat';

jest.mock('@/shared/contexts/admin-session-context', () => ({ useAdminSession: () => ({ session: { user: { id: 'admin' } } }) }));
jest.mock('@/app/services/admin', () => ({ __esModule: true, default: { userAppearance: {
  getUserDetails: async () => ({}), getUserGems: async () => ({ gemBalance: 0 }),
} } }));
jest.mock('@/app/services/support-chat', () => ({ __esModule: true, default: { getSessionDetail: jest.fn() } }));
jest.mock('@/app/admin/support-chat/hooks/useSupportChatSocket');
const fetchDetail = service.getSessionDetail as jest.Mock;
const detail = (sessionId: string): SupportSessionDetail => ({
  sessionId, user: { id: 'u' }, status: 'waiting_admin', language: 'ko', createdAt: '2026-10-01T00:00:00Z',
  messages: [{ id: sessionId, sessionId, senderType: 'user', content: `reply-${sessionId}`, createdAt: '2026-10-01T00:00:00Z' }],
});
function deferred() {
  let resolve!: (value: SupportSessionDetail) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<SupportSessionDetail>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  localStorage.clear(); fetchDetail.mockReset();
  HTMLElement.prototype.scrollIntoView = jest.fn();
  (useSupportChatSocket as jest.Mock).mockReturnValue({ state: { connected: false, sessionJoined: false, error: null }, setTyping: jest.fn(), reconnect: jest.fn() });
});

describe.each(['panel', 'dialog'] as const)('%s viewed unread state', (surface) => {
  const view = (id: string, open = true) => surface === 'panel'
    ? <ChatPanel sessionId={open ? id : null} onSessionUpdated={jest.fn()} />
    : <ChatDetailDialog open={open} sessionId={id} onClose={jest.fn()} onSessionUpdated={jest.fn()} />;

  it('marks only rendered current-session details and ignores stale responses', async () => {
    const first = deferred(); const second = deferred();
    fetchDetail.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const tracker = renderHook(() => useReadState());
    const mounted = render(view('a'));
    expect(tracker.result.current.isUnread('a', detail('a').messages)).toBe(true);
    mounted.rerender(view('b'));
    await act(async () => first.resolve(detail('a')));
    expect(screen.queryByText('reply-a')).toBeNull();
    expect(tracker.result.current.isUnread('a', detail('a').messages)).toBe(true);
    expect(tracker.result.current.isUnread('b', detail('b').messages)).toBe(true);
    await act(async () => second.resolve(detail('b')));
    expect(screen.getByText('reply-b')).toBeTruthy();
    expect(tracker.result.current.isUnread('b', detail('b').messages)).toBe(false);
  });

  it('does not mark on failed details, mismatched details, or completion after close', async () => {
    const failed = deferred(); const mismatched = deferred(); const closed = deferred();
    fetchDetail.mockReturnValueOnce(failed.promise).mockReturnValueOnce(mismatched.promise).mockReturnValueOnce(closed.promise);
    const tracker = renderHook(() => useReadState());
    const mounted = render(view('a'));
    await act(async () => failed.reject(new Error('Unavailable')));
    expect(tracker.result.current.isUnread('a', detail('a').messages)).toBe(true);
    mounted.rerender(view('b'));
    await act(async () => mismatched.resolve(detail('a')));
    expect(tracker.result.current.isUnread('b', detail('b').messages)).toBe(true);
    mounted.rerender(view('c'));
    mounted.rerender(view('c', false));
    await act(async () => closed.resolve(detail('c')));
    expect(tracker.result.current.isUnread('c', detail('c').messages)).toBe(true);
  });

  it('marks user replies arriving while the successfully loaded conversation is displayed', async () => {
    fetchDetail.mockResolvedValue(detail('a'));
    const tracker = renderHook(() => useReadState());
    await act(async () => { render(view('a')); });
    const next = { ...detail('a').messages[0], id: 'next', content: 'next-reply', createdAt: '2026-10-01T00:01:00Z' };
    const options = (useSupportChatSocket as jest.Mock).mock.calls.at(-1)![0];
    act(() => options.onNewMessage(next));
    expect(screen.getByText('next-reply')).toBeTruthy();
    expect(tracker.result.current.isUnread('a', [next])).toBe(false);
  });
});
