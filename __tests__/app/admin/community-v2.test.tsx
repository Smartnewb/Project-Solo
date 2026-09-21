import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminCommunity from '@/app/admin/community/community-v2';
import communityService from '@/app/services/community';

jest.mock('react-hook-form', () => ({
  Controller: ({ render, name }: { render: (props: unknown) => React.ReactNode; name: string }) =>
    render({
      field: {
        name,
        value: '',
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
    get: (key: string) => (key === 'tab' ? 'reports' : null),
  })),
}));

jest.mock('@/shared/ui/admin/toast/toast-context', () => ({
  useToast: jest.fn(() => ({ error: jest.fn(), success: jest.fn() })),
}));

jest.mock('@/shared/ui/admin/confirm-dialog/confirm-dialog-context', () => ({
  useConfirm: jest.fn(() => ({ confirm: jest.fn() })),
}));

jest.mock('@/app/admin/hooks/forms', () => ({
  useAdminForm: jest.fn(() => ({
    control: {},
    watch: jest.fn(() => ''),
    reset: jest.fn(),
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
    userAppearance: {
      getUserDetails: jest.fn(),
    },
  },
}));

jest.mock('@/app/services/community', () => ({
  __esModule: true,
  default: {
    getArticles: jest.fn(),
    getCategories: jest.fn(),
    getCommunityReports: jest.fn(),
    processReport: jest.fn(),
    blindArticle: jest.fn(),
    getComments: jest.fn(),
    getArticleDetail: jest.fn(),
    bulkBlindArticles: jest.fn(),
    deleteArticle: jest.fn(),
    moveArticleCategory: jest.fn(),
  },
}));

const mockedCommunityService = communityService as jest.Mocked<typeof communityService>;
const mockedGetArticles = communityService.getArticles as jest.MockedFunction<typeof communityService.getArticles>;
const mockedGetCommunityReports =
  communityService.getCommunityReports as jest.MockedFunction<typeof communityService.getCommunityReports>;

describe('AdminCommunity deep link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCommunityService.getCategories.mockResolvedValue({ categories: [] });
    mockedGetArticles.mockResolvedValue({
      items: [],
      meta: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    mockedGetCommunityReports.mockResolvedValue({
      items: [],
      meta: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it('opens the reports tab from the tab query parameter', async () => {
    render(<AdminCommunity />);

    await waitFor(() => {
      expect(mockedGetCommunityReports).toHaveBeenCalled();
    });

    expect(mockedGetArticles).not.toHaveBeenCalled();
  });
});
