import { act, renderHook } from '@testing-library/react';
import { useSessionMessages } from '@/app/admin/support-chat/hooks/useSessionMessages';
import service from '@/app/services/support-chat';
import type { SupportSessionDetail, SupportSessionSummary } from '@/app/types/support-chat';

jest.mock('@/app/services/support-chat', () => ({ __esModule: true, default: { getSessionDetail: jest.fn() } }));
const fetchDetail = service.getSessionDetail as jest.Mock;
const summary = (sessionId: string, messageCount = 1): SupportSessionSummary => ({
  sessionId, messageCount, userId: 'u', language: 'ko', status: 'waiting_admin', createdAt: '2026-10-01T00:00:00Z',
});
const detail = (sessionId: string): SupportSessionDetail => ({
  sessionId, user: { id: 'u' }, language: 'ko', status: 'waiting_admin', createdAt: '2026-10-01T00:00:00Z',
  messages: [{ id: sessionId, sessionId, senderType: 'user', content: sessionId, createdAt: '2026-10-01T00:00:00Z' }],
});
function deferred() {
  let resolve!: (value: SupportSessionDetail) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<SupportSessionDetail>((res, rej) => { resolve = res; reject = rej; });
  return { resolve, reject, promise };
}
beforeEach(() => fetchDetail.mockReset());

it('loads details once and preserves unchanged sessions when another count changes', async () => {
  fetchDetail.mockImplementation(async (id: string) => detail(id));
  const hook = renderHook(({ sessions }) => useSessionMessages(sessions), { initialProps: { sessions: [summary('a'), summary('b')] } });
  await act(async () => {});
  const unchanged = hook.result.current.messagesBySession.b;
  hook.rerender({ sessions: [summary('a'), summary('b')] });
  expect(fetchDetail).toHaveBeenCalledTimes(2);
  await act(async () => hook.rerender({ sessions: [summary('a', 2), summary('b')] }));
  expect(fetchDetail).toHaveBeenCalledTimes(3);
  expect(hook.result.current.messagesBySession.b).toBe(unchanged);
});

it('ignores superseded, removed, and unmounted requests and reports current failures', async () => {
  const old = deferred(); const current = deferred(); const removed = deferred();
  fetchDetail.mockReturnValueOnce(old.promise).mockReturnValueOnce(removed.promise).mockReturnValueOnce(current.promise);
  const hook = renderHook(({ sessions }) => useSessionMessages(sessions), { initialProps: { sessions: [summary('a'), summary('b')] } });
  hook.rerender({ sessions: [summary('a', 2)] });
  await act(async () => { old.resolve(detail('a')); removed.resolve(detail('b')); });
  expect(hook.result.current.messagesBySession).toEqual({});
  await act(async () => current.reject(new Error('detail unavailable')));
  expect(hook.result.current.errorsBySession).toEqual({ a: 'detail unavailable' });
  const pending = deferred(); fetchDetail.mockReturnValueOnce(pending.promise);
  hook.rerender({ sessions: [summary('a', 3)] });
  expect(hook.result.current.errorsBySession).toEqual({});
  hook.unmount();
  await act(async () => pending.resolve(detail('a')));
});

it('rejects details belonging to a different session', async () => {
  fetchDetail.mockResolvedValue(detail('wrong'));
  const sessions = [summary('a')];
  const hook = renderHook(() => useSessionMessages(sessions));
  await act(async () => {});
  expect(hook.result.current.messagesBySession).toEqual({});
  expect(hook.result.current.errorsBySession.a).toBeDefined();
});
