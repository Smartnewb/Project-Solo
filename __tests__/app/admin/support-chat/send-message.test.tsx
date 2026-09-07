import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ChatDetailDialog from '@/app/admin/support-chat/components/ChatDetailDialog';
import ChatPanel from '@/app/admin/support-chat/components/ChatPanel';
import { useSupportChatSocket } from '@/app/admin/support-chat/hooks/useSupportChatSocket';
import type { SupportSessionDetail } from '@/app/types/support-chat';

jest.mock('@/shared/contexts/admin-session-context', () => ({
  useAdminSession: () => ({ session: { user: { id: 'admin-1' } } }),
}));
jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: {
    userAppearance: {
      getUserDetails: async () => ({}),
      getUserGems: async () => ({ gemBalance: 0 }),
    },
  },
}));
jest.mock('@/app/admin/support-chat/hooks/useSupportChatSocket');

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function response(body: unknown, status = 200): Response {
  return { ok: status < 400, status, text: async () => JSON.stringify(body) } as Response;
}

const session: SupportSessionDetail = {
  sessionId: 'session-1', user: { id: 'user-1', nickname: 'Fixture user' },
  status: 'admin_handling', language: 'ko', messages: [], createdAt: '2026-09-07T00:00:00Z',
};
const receipt = {
  success: true, messageId: 'message-1', sessionId: session.sessionId,
  createdAt: '2026-09-07T01:00:00Z',
};
const endpoint = '/api/admin-proxy/support-chat/admin/sessions/session-1/messages';
const originalFetch = global.fetch;

describe.each(['dialog', 'panel'] as const)('%s admin send', (surface) => {
  let pending: ReturnType<typeof deferred<Response>>;
  let fetchMock: jest.Mock;
  let socketSend: jest.Mock;
  let updated: jest.Mock;

  beforeEach(() => {
    pending = deferred<Response>();
    updated = jest.fn();
    socketSend = jest.fn(() => new Promise<boolean>(() => {}));
    (useSupportChatSocket as jest.Mock).mockReturnValue({
      state: { connected: false, sessionJoined: false, error: null },
      sendMessage: socketSend, setTyping: jest.fn(), reconnect: jest.fn(),
    });
    fetchMock = jest.fn((url: string, init?: RequestInit) => {
      if (url === endpoint && init?.method === 'POST') {
        init.signal?.addEventListener('abort', () => pending.reject(new DOMException('Aborted', 'AbortError')), { once: true });
        return pending.promise;
      }
      if (url === '/api/admin-proxy/support-chat/admin/sessions/session-1') return Promise.resolve(response(session));
      throw new Error(`Unexpected request: ${init?.method} ${url}`);
    });
    global.fetch = fetchMock;
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  async function mount() {
    await act(async () => {
      render(surface === 'dialog'
        ? <ChatDetailDialog open sessionId={session.sessionId} onClose={jest.fn()} onSessionUpdated={updated} />
        : <ChatPanel sessionId={session.sessionId} onSessionUpdated={updated} />);
    });
    return screen.getByRole('textbox');
  }

  function sendButton() { return screen.getByTestId('SendIcon').closest('button')!; }
  function posts() { return fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST'); }

  it.each(['Enter', 'click'])('sends by %s through the authenticated REST path even without a socket', async (action) => {
    const input = await mount();
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: '  fixture reply  ' } });
    if (action === 'Enter') fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    else fireEvent.click(sendButton());
    expect(posts()).toHaveLength(1);
    expect(posts()[0][0]).toBe(endpoint);
    expect(JSON.parse(posts()[0][1].body)).toEqual({ content: 'fixture reply' });
    expect(posts()[0][1].headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(socketSend).not.toHaveBeenCalled();
    await act(async () => pending.resolve(response(receipt, 201)));
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('does not wait for a socket acknowledgement or send duplicates during a pending request', async () => {
    (useSupportChatSocket as jest.Mock).mockReturnValue({
      state: { connected: true, sessionJoined: true, error: null },
      sendMessage: socketSend, setTyping: jest.fn(), reconnect: jest.fn(),
    });
    const input = await mount();
    fireEvent.change(input, { target: { value: 'one reply' } });
    const button = sendButton();
    act(() => {
      fireEvent.click(button);
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.click(button);
    });
    expect(posts()).toHaveLength(1);
    expect(socketSend).not.toHaveBeenCalled();
    expect(input).toBeDisabled();
    await act(async () => pending.resolve(response(receipt, 201)));
    expect(screen.getByRole('textbox')).toBeEnabled();
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('preserves the draft and shows an error on rejection; retries only on a new action', async () => {
    const input = await mount();
    fireEvent.change(input, { target: { value: 'keep my draft' } });
    fireEvent.click(sendButton());
    await act(async () => pending.resolve(response({ message: 'fixture-send-rejected' }, 503)));
    expect(input).toHaveValue('keep my draft');
    expect(input).toBeEnabled();
    // MUI's modal marks the sibling Snackbar aria-hidden; it is still visually shown.
    expect(screen.getByRole('alert', { hidden: true })).toBeVisible();
    expect(updated).not.toHaveBeenCalled();
    expect(posts()).toHaveLength(1);
    pending = deferred<Response>();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(posts()).toHaveLength(2);
    await act(async () => pending.resolve(response(receipt, 201)));
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('bounds a stalled request, preserves the draft, and does not automatically retry', async () => {
    jest.useFakeTimers();
    const input = await mount();
    fireEvent.change(input, { target: { value: 'uncertain delivery' } });
    fireEvent.click(sendButton());
    expect(posts()).toHaveLength(1);
    await act(async () => jest.advanceTimersByTime(30_000));
    expect(input).toHaveValue('uncertain delivery');
    expect(input).toBeEnabled();
    expect(screen.getByRole('alert', { hidden: true })).toBeVisible();
    expect(posts()).toHaveLength(1);
    expect(updated).not.toHaveBeenCalled();
  });

  it('does not send whitespace, Shift+Enter, or IME composition Enter', async () => {
    const input = await mount();
    fireEvent.change(input, { target: { value: '  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'composing' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(posts()).toHaveLength(0);
    expect(socketSend).not.toHaveBeenCalled();
    expect(input).toHaveValue('composing');
  });
});
