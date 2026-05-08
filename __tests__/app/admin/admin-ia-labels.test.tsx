import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ActionRequired from '@/app/admin/dashboard/components/ActionRequired';
import QuickAccess from '@/app/admin/dashboard/components/QuickAccess';
import AdminService from '@/app/services/admin';
import { getReviewInbox } from '@/app/services/review-inbox';
import { AdminSidebar } from '@/shared/ui/admin/sidebar';

jest.mock('next/link', () => {
  const MockNextLink = React.forwardRef<
    HTMLAnchorElement,
    { href: string; children: React.ReactNode }
  >(function MockNextLink({ href, children, ...props }, ref) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  });

  return {
    __esModule: true,
    default: MockNextLink,
  };
});

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin/dashboard'),
}));

jest.mock('@/app/services/admin', () => ({
  __esModule: true,
  default: {
    userReview: {
      getPendingUsers: jest.fn(),
    },
    userAppearance: {
      getUniversityVerificationPending: jest.fn(),
    },
  },
}));

jest.mock('@/app/services/review-inbox', () => ({
  getReviewInbox: jest.fn(),
}));

const mockedGetReviewInbox = getReviewInbox as jest.MockedFunction<typeof getReviewInbox>;
const mockedGetPendingUsers =
  AdminService.userReview.getPendingUsers as jest.MockedFunction<typeof AdminService.userReview.getPendingUsers>;
const mockedGetUniversityVerificationPending =
  AdminService.userAppearance
    .getUniversityVerificationPending as jest.MockedFunction<
    typeof AdminService.userAppearance.getUniversityVerificationPending
  >;

describe('admin IA labels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockedGetPendingUsers.mockResolvedValue({
      data: [],
      meta: { total: 2 },
    });
    mockedGetUniversityVerificationPending.mockResolvedValue({
      items: [],
      pagination: { total: 1 },
    });
    mockedGetReviewInbox.mockResolvedValue({
      summary: {
        approval: 2,
        judgment: 3,
        done: 19,
      },
      buckets: {
        approval: { total: 2, items: [] },
        judgment: { total: 3, items: [] },
        done: { total: 19, items: [] },
      },
      doneBreakdown: {
        profile_report: 10,
        community_report: 5,
        support_chat: 4,
      },
      generatedAt: '2026-04-15T10:01:00.000Z',
      warnings: [],
    });
  });

  it('shows explicit sidebar labels for profile reports and the review inbox', () => {
    render(<AdminSidebar />);

    expect(screen.getByRole('link', { name: '프로필 신고 관리' })).toHaveAttribute('href', '/admin/reports');
    expect(screen.getByRole('link', { name: '검토 인박스' })).toHaveAttribute('href', '/admin/review-inbox');
    expect(screen.queryByRole('link', { name: 'AI 검토 인박스' })).not.toBeInTheDocument();
  });

  it('lets operators pin sidebar menu items as local favorites', async () => {
    const user = userEvent.setup();

    render(<AdminSidebar />);

    await user.click(screen.getByRole('button', { name: '검토 인박스 즐겨찾기 추가' }));

    expect(screen.getByRole('heading', { name: '즐겨찾기' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /검토 인박스/ })[0]).toHaveAttribute(
      'href',
      '/admin/review-inbox',
    );
    expect(window.localStorage.getItem('admin-sidebar.favorite-hrefs.v1')).toContain(
      '/admin/review-inbox',
    );

    await user.click(screen.getAllByRole('button', { name: '검토 인박스 즐겨찾기 해제' })[0]);

    expect(screen.queryByRole('heading', { name: '즐겨찾기' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem('admin-sidebar.favorite-hrefs.v1')).toBe('[]');
  });

  it('uses 검토 인박스 in quick access', () => {
    render(<QuickAccess />);

    expect(screen.getByRole('link', { name: /검토 인박스/i })).toHaveAttribute('href', '/admin/review-inbox');
    expect(screen.queryByText('AI 검토 인박스')).not.toBeInTheDocument();
  });

  it('uses 검토 인박스 in action required cards', async () => {
    render(<ActionRequired />);

    expect(await screen.findByRole('link', { name: /검토 인박스/i })).toHaveAttribute(
      'href',
      '/admin/review-inbox',
    );
    expect(screen.queryByText('AI 검토 인박스')).not.toBeInTheDocument();
  });
});
