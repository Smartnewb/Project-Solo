import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SupportChatV2 from '@/app/admin/support-chat/support-chat-v2';

let mockSessionFromUrl: string | null = null;
let mockIsMobile = false;
const mockReplace = jest.fn();

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

jest.mock('@/app/admin/support-chat/components/StatusCountBar', () => ({
  __esModule: true,
  default: () => <div>status-count-bar</div>,
}));

jest.mock('@/app/admin/support-chat/components/SessionQueue', () => ({
  __esModule: true,
  default: ({ selectedSessionId }: { selectedSessionId: string | null }) => (
    <div>session-queue:{selectedSessionId ?? 'none'}</div>
  ),
}));

jest.mock('@/app/admin/support-chat/components/ChatPanel', () => ({
  __esModule: true,
  default: ({ sessionId }: { sessionId: string | null }) => <div>chat-panel:{sessionId ?? 'none'}</div>,
}));

jest.mock('@/app/admin/support-chat/hooks/useSessionPolling', () => ({
  useSessionPolling: jest.fn(() => ({
    activeSessions: [],
    resolvedSessions: [],
    statusCounts: { waiting: 0, handling: 0, resolved: 0 },
    newSessionIds: new Set<string>(),
    clearNewSessionIds: jest.fn(),
    refresh: jest.fn(),
  })),
}));

describe('SupportChatV2 mobile session deep link', () => {
  beforeEach(() => {
    mockSessionFromUrl = null;
    mockIsMobile = false;
    mockReplace.mockReset();
  });

  it('opens chat on first mobile render when session query exists', () => {
    mockIsMobile = true;
    mockSessionFromUrl = 'session-123';

    render(<SupportChatV2 />);

    expect(screen.getByText('chat-panel:session-123')).toBeInTheDocument();
    expect(screen.queryByText('session-queue:session-123')).not.toBeInTheDocument();
  });

  it('keeps desktop split layout when session query exists', () => {
    mockIsMobile = false;
    mockSessionFromUrl = 'session-123';

    render(<SupportChatV2 />);

    expect(screen.getByText('session-queue:session-123')).toBeInTheDocument();
    expect(screen.getByText('chat-panel:session-123')).toBeInTheDocument();
  });
});
