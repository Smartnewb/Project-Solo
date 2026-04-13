import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportsV2 from '@/app/admin/reports/reports-v2';
import AdminService from '@/app/services/admin';

jest.mock('react-hook-form', () => ({
  Controller: ({ render, name }: { render: (props: unknown) => React.ReactNode; name: string }) =>
    render({
      field: {
        name,
        value: 'pending',
        onChange: jest.fn(),
        onBlur: jest.fn(),
        ref: jest.fn(),
      },
      fieldState: {},
      formState: {},
    }),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: (key: string) => (key === 'reportId' ? 'profile-pending-1' : null),
  })),
}));

jest.mock('@/shared/ui/admin/toast/toast-context', () => ({
  useToast: jest.fn(() => ({
    error: jest.fn(),
    success: jest.fn(),
  })),
}));

jest.mock('@/app/admin/hooks/forms', () => ({
  useAdminForm: jest.fn(() => ({
    control: {},
    watch: jest.fn(() => 'pending'),
    setValue: jest.fn(),
    handleFormSubmit: (callback: (...args: unknown[]) => unknown) => callback,
  })),
}));

jest.mock('@/components/admin/appearance/UserDetailModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: {
    getProfileReports: jest.fn(),
    reports: {
      getProfileReportDetail: jest.fn(),
      getChatHistory: jest.fn(),
      getUserProfileImages: jest.fn(),
      updateReportStatus: jest.fn(),
    },
    userAppearance: {
      getUserDetails: jest.fn(),
    },
  },
}));

const mockedAdminService = AdminService as jest.Mocked<typeof AdminService>;
const mockedGetProfileReportDetail =
  AdminService.reports.getProfileReportDetail as jest.MockedFunction<
    typeof AdminService.reports.getProfileReportDetail
  >;

describe('ReportsV2 deep link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAdminService.getProfileReports.mockResolvedValue({
      items: [],
      meta: { total: 0 },
    });
    mockedGetProfileReportDetail.mockResolvedValue({
      id: 'profile-pending-1',
      reporter: {
        id: 'r-1',
        name: '신고자A',
        email: 'reporter@test.com',
        phoneNumber: '010-1111-2222',
        age: 24,
        gender: 'FEMALE',
        profileImageUrl: '',
      },
      reported: {
        id: 'u-1',
        name: '피신고자A',
        email: 'reported@test.com',
        phoneNumber: '010-3333-4444',
        age: 25,
        gender: 'MALE',
        profileImageUrl: '',
      },
      reason: '허위 프로필',
      description: '프로필 내용이 실제와 다릅니다.',
      evidenceImages: ['https://img.test/a.png'],
      status: 'pending',
      createdAt: '2026-04-15T09:00:00.000Z',
      updatedAt: null,
    });
  });

  it('opens the report detail dialog from the reportId query parameter', async () => {
    render(<ReportsV2 />);

    await waitFor(() => {
      expect(mockedGetProfileReportDetail).toHaveBeenCalledWith('profile-pending-1');
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('profile-pending-1')).toBeInTheDocument();
    expect(screen.getByText('허위 프로필')).toBeInTheDocument();
  });
});
