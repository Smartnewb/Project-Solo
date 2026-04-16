import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatManagementTab from '@/app/admin/chat/components/ChatManagementTab';

const mockGetChatRooms = jest.fn();

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');

  return {
    ...actual,
    TablePagination: ({ count, page, rowsPerPage, onPageChange, labelDisplayedRows }: any) => {
      const from = count === 0 ? 0 : page * rowsPerPage + 1;
      const to = Math.min((page + 1) * rowsPerPage, count);

      return (
        <div>
          <button
            type="button"
            onClick={(event) => onPageChange(event, page + 1)}
            disabled={(page + 1) * rowsPerPage >= count}
          >
            next-page
          </button>
          <span>{labelDisplayedRows({ from, to, count, page })}</span>
        </div>
      );
    },
  };
});

const buildChatRoom = (id: string) => ({
  id,
  male: { id: 'm', name: 'M', profileImage: '' },
  female: { id: 'f', name: 'F', profileImage: '' },
  isActive: true,
  lastMessageAt: null,
  createdAt: '2024-01-01T00:00:00Z',
});

jest.mock('@/app/services/chat', () => {
  return {
    __esModule: true,
    default: {
      getChatRooms: (...args: any[]) => mockGetChatRooms(...args),
      getChatMessages: jest.fn().mockResolvedValue({ messages: [] }),
      exportChatsToCsv: jest.fn().mockResolvedValue(undefined),
    },
  };
});

jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: {
    userAppearance: {
      getUserDetails: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('@/components/admin/appearance/UserDetailModal', () => ({
  __esModule: true,
  default: () => <div data-testid="user-detail-modal" />,
}));

describe('ChatManagementTab preset pagination bug', () => {
  beforeEach(() => {
    mockGetChatRooms.mockReset();
    mockGetChatRooms.mockResolvedValue({
      chatRooms: Array.from({ length: 20 }, (_, i) => buildChatRoom(`room-${i}`)),
      total: 60,
      appliedStartDate: '2024-01-01',
      appliedEndDate: '2024-01-01',
    });
  });

  it('resets to page 1 when a date preset is clicked after navigating to a later page', async () => {
    render(<ChatManagementTab />);

    await waitFor(() => {
      expect(mockGetChatRooms).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, preset: '7days' })
      );
    });

    mockGetChatRooms.mockClear();

    await waitFor(() => {
      expect(screen.getByText('room-0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'next-page' }));

    await waitFor(() => {
      expect(mockGetChatRooms.mock.calls.some((call) => call[0].page === 2)).toBe(true);
    });

    mockGetChatRooms.mockClear();
    mockGetChatRooms.mockResolvedValueOnce({
      chatRooms: [],
      total: 0,
      appliedStartDate: '2024-01-02',
      appliedEndDate: '2024-01-02',
    });

    const todayButton = screen.getByRole('button', { name: '오늘' });
    fireEvent.click(todayButton);

    await waitFor(() => {
      expect(mockGetChatRooms).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, preset: 'today' })
      );
    });

    const staleCalls = mockGetChatRooms.mock.calls.filter(
      ([args]) => args.page !== 1 && args.preset === 'today'
    );
    expect(staleCalls).toHaveLength(0);
  });
});
