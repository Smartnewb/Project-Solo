import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPanel from '@/app/admin/support-chat/components/ChatPanel';
import supportChatService from '@/app/services/support-chat';
import AdminService from '@/app/services/admin';
import type { SupportSessionDetail } from '@/app/types/support-chat';

jest.mock('@/app/services/support-chat', () => ({
  __esModule: true,
  default: {
    getSessionDetail: jest.fn(),
    takeoverSession: jest.fn(),
    resolveSession: jest.fn(),
  },
}));

jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: {
    userAppearance: {
      getUserDetails: jest.fn(),
      getUserGems: jest.fn(),
    },
    gems: {
      bulkGrant: jest.fn(),
    },
  },
}));

jest.mock('@/app/admin/support-chat/hooks/useSupportChatSocket', () => ({
  useSupportChatSocket: jest.fn(() => ({
    state: {
      connected: false,
      sessionJoined: false,
      error: null,
    },
    sendMessage: jest.fn(),
  })),
}));

const mockedSupportChatService = supportChatService as jest.Mocked<typeof supportChatService>;
const mockedGetUserDetails = AdminService.userAppearance.getUserDetails as jest.Mock;
const mockedGetUserGems = AdminService.userAppearance.getUserGems as jest.Mock;
const mockedBulkGrant = AdminService.gems.bulkGrant as jest.Mock;

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const baseSession: SupportSessionDetail = {
  sessionId: 'session-1',
  user: {
    id: 'user-1',
    nickname: '강연태',
    phoneNumber: '010-****-3424',
    universityName: '강원대학교 춘천캠퍼스',
  },
  status: 'waiting_admin',
  language: 'ko',
  messages: [
    {
      id: 'message-1',
      sessionId: 'session-1',
      senderType: 'user',
      content: '방금 매칭된 상대에게 좋아요를 보냈는데, 구슬이 8개가 사라졌어요',
      createdAt: '2026-05-13T14:16:00.000Z',
    },
  ],
  createdAt: '2026-05-13T14:15:00.000Z',
};

describe('ChatPanel support user contact and gem grant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSupportChatService.getSessionDetail.mockResolvedValue(baseSession);
    mockedGetUserDetails.mockResolvedValue({
      userId: 'user-1',
      phoneNumber: '010-1234-3424',
    } as any);
    mockedGetUserGems.mockResolvedValue({
      userId: 'user-1',
      gemBalance: 8,
      totalCharged: 10,
      totalConsumed: 2,
    } as any);
    mockedBulkGrant.mockResolvedValue({
      totalProcessed: 1,
      successCount: 1,
      failedCount: 0,
      errors: [],
      pushNotificationResult: {
        pushSuccessCount: 1,
        pushFailureCount: 0,
      },
    } as any);
  });

  it('shows the original admin user phone number instead of the masked support-chat phone', async () => {
    render(<ChatPanel sessionId="session-1" onSessionUpdated={jest.fn()} />);

    expect(await screen.findByText('010-1234-3424')).toBeInTheDocument();
    expect(screen.queryByText('010-****-3424')).not.toBeInTheDocument();
    expect(screen.getByText('8개')).toBeInTheDocument();
  });

  it('falls back to the support-chat phone number when admin user detail lookup fails', async () => {
    mockedGetUserDetails.mockRejectedValue(new Error('detail failed'));

    render(<ChatPanel sessionId="session-1" onSessionUpdated={jest.fn()} />);

    expect(await screen.findByText('010-****-3424')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /구슬 지급/ })).toBeDisabled();
  });

  it('grants gems with a push message to the current support user and refreshes gem balance', async () => {
    mockedGetUserGems
      .mockResolvedValueOnce({
        userId: 'user-1',
        gemBalance: 8,
        totalCharged: 10,
        totalConsumed: 2,
      } as any)
      .mockResolvedValueOnce({
        userId: 'user-1',
        gemBalance: 16,
        totalCharged: 18,
        totalConsumed: 2,
      } as any);

    render(<ChatPanel sessionId="session-1" onSessionUpdated={jest.fn()} />);

    const openButton = await screen.findByRole('button', { name: '구슬 지급' });
    fireEvent.click(openButton);

    fireEvent.change(screen.getByLabelText('지급할 구슬 개수'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('푸시 알림 메시지'), {
      target: { value: '상담 보상으로 구슬 8개를 지급했어요.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /구슬 지급 및 알림 발송/ }));

    await waitFor(() => {
      expect(mockedBulkGrant).toHaveBeenCalledWith({
        phoneNumbers: ['010-1234-3424'],
        gemAmount: 8,
        message: '상담 보상으로 구슬 8개를 지급했어요.',
      });
    });

    expect(await screen.findByText(/구슬 8개 지급이 완료되었습니다/)).toBeInTheDocument();
    expect(await screen.findByText('16개')).toBeInTheDocument();
  });

  it('disables gem grant when the original phone number is unavailable', async () => {
    mockedSupportChatService.getSessionDetail.mockResolvedValue({
      ...baseSession,
      user: {
        ...baseSession.user,
        phoneNumber: undefined,
      },
    });
    mockedGetUserDetails.mockResolvedValue({
      userId: 'user-1',
      phoneNumber: null,
    } as any);

    render(<ChatPanel sessionId="session-1" onSessionUpdated={jest.fn()} />);

    const button = await screen.findByRole('button', { name: /구슬 지급/ });
    await waitFor(() => expect(button).toBeDisabled());
  });
});
