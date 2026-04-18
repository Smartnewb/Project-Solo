import { renderHook, waitFor } from '@testing-library/react';
import { useSessionPolling } from '@/app/admin/support-chat/hooks/useSessionPolling';
import supportChatService from '@/app/services/support-chat';

jest.mock('@/app/services/support-chat', () => ({
  __esModule: true,
  default: {
    getSessions: jest.fn(),
  },
}));

const mockedSupportChatService = supportChatService as jest.Mocked<typeof supportChatService>;

describe('useSessionPolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('counts only waiting_admin as waiting and treats bot_handling as handling', async () => {
    mockedSupportChatService.getSessions.mockImplementation(async ({ status = 'waiting_admin' }) => {
      if (status === 'waiting_admin') {
        return {
          sessions: [
            {
              sessionId: 'waiting-1',
              userId: 'user-1',
              userNickname: '대기 유저',
              status: 'waiting_admin',
              language: 'ko',
              messageCount: 1,
              createdAt: '2026-04-18T00:00:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        };
      }

      if (status === 'admin_handling') {
        return {
          sessions: [
            {
              sessionId: 'admin-1',
              userId: 'user-2',
              userNickname: '어드민 응대',
              status: 'admin_handling',
              language: 'ko',
              messageCount: 2,
              createdAt: '2026-04-18T00:01:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        };
      }

      if (status === 'bot_handling') {
        return {
          sessions: [
            {
              sessionId: 'bot-1',
              userId: 'user-3',
              userNickname: 'AI 응대',
              status: 'bot_handling',
              language: 'ko',
              messageCount: 3,
              createdAt: '2026-04-18T00:02:00.000Z',
            },
            {
              sessionId: 'bot-2',
              userId: 'user-4',
              userNickname: 'AI 응대2',
              status: 'bot_handling',
              language: 'ja',
              messageCount: 4,
              createdAt: '2026-04-18T00:03:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
        };
      }

      if (status === 'resolved') {
        return {
          sessions: [
            {
              sessionId: 'resolved-1',
              userId: 'user-5',
              userNickname: '해결 유저',
              status: 'resolved',
              language: 'ko',
              messageCount: 5,
              createdAt: '2026-04-18T00:04:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        };
      }

      throw new Error(`Unexpected status: ${status}`);
    });

    const { result } = renderHook(() => useSessionPolling());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statusCounts).toEqual({
      waiting: 1,
      handling: 3,
      resolved: 1,
    });
    expect(result.current.activeSessions).toHaveLength(4);
    expect(result.current.resolvedSessions).toHaveLength(1);
  });
});
