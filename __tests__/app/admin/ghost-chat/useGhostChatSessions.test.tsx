import { act, renderHook, waitFor } from '@testing-library/react';
import { useGhostChatSessions } from '@/app/admin/ghost-chat/hooks/useGhostChatSessions';
import { ghostChat } from '@/app/services/admin/ghost-chat';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';
import type { GhostChatEvent, GhostChatSession } from '@/app/types/ghost-chat';

let capturedOnEvent: ((event: GhostChatEvent) => void) | undefined;

jest.mock('@/app/services/admin/ghost-chat', () => ({
	ghostChat: {
		listSessions: jest.fn(),
		getSession: jest.fn(),
		assignSession: jest.fn(),
		sendMessage: jest.fn(),
		closeSession: jest.fn(),
		eventsUrl: jest.fn(() => '/api/admin-proxy/admin/ghost-chat/events'),
	},
}));

jest.mock('@/app/admin/ghost-chat/hooks/useGhostChatEvents', () => ({
	useGhostChatEvents: jest.fn(({ onEvent }) => {
		capturedOnEvent = onEvent;
		return {
			state: 'connected',
			lastEventAt: null,
			error: null,
			reconnect: jest.fn(),
		};
	}),
}));

const mockedGhostChat = ghostChat as jest.Mocked<typeof ghostChat>;

function makeSession(overrides: Partial<GhostChatSession> = {}): GhostChatSession {
	return {
		id: 'session-1',
		ghostAccountId: 'ghost-account-1',
		ghostUserId: 'ghost-user-1',
		targetUserId: 'target-user-1',
		matchId: 'match-1',
		chatRoomId: 'room-1',
		state: 'PENDING',
		assignedAdminId: null,
		assignedAt: null,
		firstUserMessageAt: null,
		lastUserMessageAt: null,
		lastAdminMessageAt: null,
		userMessageCount: 0,
		adminMessageCount: 0,
		closedAt: null,
		closedReason: null,
		createdAt: '2026-05-03T09:12:00.000Z',
		updatedAt: '2026-05-03T09:12:00.000Z',
		deletedAt: null,
		...overrides,
	};
}

describe('useGhostChatSessions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		capturedOnEvent = undefined;
		mockedGhostChat.listSessions.mockResolvedValue([makeSession()]);
		mockedGhostChat.getSession.mockResolvedValue(makeSession());
		mockedGhostChat.assignSession.mockResolvedValue({ ok: true });
		mockedGhostChat.sendMessage.mockResolvedValue({ ok: true });
		mockedGhostChat.closeSession.mockResolvedValue({ ok: true });
	});

	it('does not add duplicate new-session badges for sessions already in the list', async () => {
		const { result } = renderHook(() => useGhostChatSessions());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		await act(async () => {
			capturedOnEvent?.({
				type: 'new_session',
				data: { sessionId: 'session-1' },
			});
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(result.current.newSessionIds.size).toBe(0);
	});

	it('refreshes the list and exposes a friendly message when selected session is missing', async () => {
		mockedGhostChat.getSession.mockRejectedValueOnce(
			new AdminApiError('not found', 404, { message: 'not found' }),
		);
		const { result } = renderHook(() => useGhostChatSessions());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		await act(async () => {
			await result.current.selectSession('missing-session').catch(() => undefined);
		});

		await waitFor(() => {
			expect(result.current.error).toBe('Ghost Chat 세션을 찾을 수 없습니다. 목록을 새로고침합니다.');
			expect(mockedGhostChat.listSessions).toHaveBeenCalledTimes(2);
		});
	});

	it('exposes an assignment conflict message when another admin already assigned the session', async () => {
		mockedGhostChat.assignSession.mockRejectedValueOnce(
			new AdminApiError('conflict', 409, { message: 'conflict' }),
		);
		const { result } = renderHook(() => useGhostChatSessions());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		await act(async () => {
			await result.current.assignSession('session-1').catch(() => undefined);
		});

		await waitFor(() => {
			expect(result.current.error).toBe('다른 어드민이 먼저 배정한 세션입니다. 목록을 새로고침합니다.');
			expect(mockedGhostChat.listSessions).toHaveBeenCalledTimes(2);
		});
	});
});
