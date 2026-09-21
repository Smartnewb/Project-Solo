import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GhostChatV2 from '@/app/admin/ghost-chat/ghost-chat-v2';

let mockSessionFromUrl: string | null = null;
let mockIsMobile = false;
const mockReplace = jest.fn();
const mockSelectSession = jest.fn();
const mockSendMessage = jest.fn();
const mockCloseSession = jest.fn();
const mockClearSelectedSession = jest.fn();
const mockReconnect = jest.fn();
const mockUseAdminSession = jest.fn();

jest.mock('@mui/material', () => {
	const actual = jest.requireActual('@mui/material');
	return {
		...actual,
		useMediaQuery: jest.fn(() => mockIsMobile),
	};
});

jest.mock('next/navigation', () => ({
	useRouter: jest.fn(() => ({
		replace: mockReplace,
	})),
	useSearchParams: jest.fn(() => ({
		get: (key: string) => (key === 'session' ? mockSessionFromUrl : null),
		toString: () => (mockSessionFromUrl ? `session=${mockSessionFromUrl}` : ''),
	})),
}));

jest.mock('@/shared/contexts/admin-session-context', () => ({
	useAdminSession: () => mockUseAdminSession(),
}));

jest.mock('@/app/admin/ghost-chat/hooks/useGhostChatSessions', () => ({
	useGhostChatSessions: () => ({
		sessions: [],
		selectedSession: null,
		selectedContext: null,
		selectedMessages: [],
		loading: false,
		messagesLoading: false,
		error: null,
		newSessionIds: new Set<string>(),
		unreadMap: {},
		statusCounts: { pending: 0, active: 0, idle: 0, closed: 0 },
		actionLoadingId: null,
		selectSession: mockSelectSession,
		sendMessage: mockSendMessage,
		closeSession: mockCloseSession,
		clearSelectedSession: mockClearSelectedSession,
		events: {
			state: 'connected',
			lastEventAt: null,
			error: null,
			reconnect: mockReconnect,
		},
	}),
}));

jest.mock('@/app/admin/ghost-chat/components/GhostChatStatusBar', () => ({
	__esModule: true,
	default: () => <div>ghost-status-bar</div>,
}));

jest.mock('@/app/admin/ghost-chat/components/GhostSessionQueue', () => ({
	__esModule: true,
	default: ({
		onSelectSession,
	}: {
		onSelectSession: (id: string) => void;
	}) => (
		<div>
			<div>chat-room-grid</div>
			<button type="button" onClick={() => onSelectSession('session-open')}>
				open-session
			</button>
		</div>
	),
}));

jest.mock('@/app/admin/ghost-chat/components/GhostChatPanel', () => ({
	__esModule: true,
	default: () => <div>ghost-chat-panel</div>,
}));

jest.mock('@/app/admin/ghost-chat/components/GhostContextPanel', () => ({
	__esModule: true,
	default: () => <div>ghost-context-panel</div>,
}));

describe('GhostChatV2', () => {
	beforeEach(() => {
		mockSessionFromUrl = null;
		mockIsMobile = false;
		mockReplace.mockReset();
		mockSelectSession.mockReset();
		mockSendMessage.mockReset();
		mockCloseSession.mockReset();
		mockClearSelectedSession.mockReset();
		mockReconnect.mockReset();
		mockUseAdminSession.mockReturnValue({
			session: {
				user: { id: 'admin-123', email: 'admin@test.com', roles: ['admin'] },
				selectedCountry: 'kr',
				issuedAt: 1,
			},
			isLoading: false,
			error: null,
			changeCountry: jest.fn(),
			logout: jest.fn(),
		});
		mockSelectSession.mockResolvedValue(undefined);
	});

	it('loads the selected session on initial deep-link render', async () => {
		mockSessionFromUrl = 'session-1';

		render(<GhostChatV2 />);

		await waitFor(() => {
			expect(mockSelectSession).toHaveBeenCalledWith('session-1');
		});
	});

	it('renders the chat room grid', () => {
		render(<GhostChatV2 />);

		expect(screen.getByText('chat-room-grid')).toBeInTheDocument();
	});

	it('selects and deep-links a chat room from the grid', async () => {
		render(<GhostChatV2 />);

		fireEvent.click(screen.getByRole('button', { name: 'open-session' }));

		await waitFor(() => {
			expect(mockSelectSession).toHaveBeenCalledWith('session-open');
			expect(mockReplace).toHaveBeenCalledWith('/admin/ghost-chat?session=session-open', { scroll: false });
		});
	});
});
