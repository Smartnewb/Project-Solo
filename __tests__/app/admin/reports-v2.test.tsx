import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import {useSearchParams} from 'next/navigation';
import ReportsV2 from '@/app/admin/reports/reports-v2';
import AdminService from '@/app/services/admin';
import { AdminApiError } from '@/shared/lib/http/admin-fetch';

const originalGetAnimations = Object.getOwnPropertyDescriptor(Element.prototype, 'getAnimations');
beforeAll(() => {
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: () => [],
  });
});
afterAll(() => {
  if (originalGetAnimations) {
    Object.defineProperty(Element.prototype, 'getAnimations', originalGetAnimations);
  } else {
    delete (Element.prototype as unknown as Record<string, unknown>).getAnimations;
  }
});

jest.mock('react-hook-form', () => ({
  Controller: ({ render, name }: { render: (props: unknown) => React.ReactNode; name: string }) =>
    render({
      field: {
        name,
        value: name === 'action' ? 'warned' : 'pending',
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

jest.mock('@/shared/ui/admin/confirm-dialog', () => ({ useConfirm: () => jest.fn().mockResolvedValue(true) }));

jest.mock('@/shared/ui/admin/toast/toast-context', () => ({
  useToast: jest.fn(() => ({
    error: jest.fn(),
    success: jest.fn(),
  })),
}));

jest.mock('@/app/admin/hooks/forms', () => ({
  useAdminForm: jest.fn(() => ({
    control: {},
    watch: jest.fn((name?: string) => (name === 'action' ? 'warned' : 'pending')),
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
        getProfileReportHistory: jest.fn(),
        getCrossBorderReports: jest.fn(),
        getCrossBorderReportDetail: jest.fn(),
        getCrossBorderReportHistory: jest.fn(),
        updateCrossBorderReportStatus: jest.fn(),
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
const mockedGetProfileReportHistory =
  AdminService.reports.getProfileReportHistory as jest.MockedFunction<
    typeof AdminService.reports.getProfileReportHistory
  >;
const mockedGetCrossBorderReports =
  AdminService.reports.getCrossBorderReports as jest.MockedFunction<
    typeof AdminService.reports.getCrossBorderReports
  >;
const mockedGetCrossBorderReportDetail =
  AdminService.reports.getCrossBorderReportDetail as jest.MockedFunction<
    typeof AdminService.reports.getCrossBorderReportDetail
  >;
const mockedGetCrossBorderReportHistory =
  AdminService.reports.getCrossBorderReportHistory as jest.MockedFunction<
    typeof AdminService.reports.getCrossBorderReportHistory
  >;
const mockedUpdateCrossBorderReportStatus =
  AdminService.reports.updateCrossBorderReportStatus as jest.MockedFunction<
    typeof AdminService.reports.updateCrossBorderReportStatus
  >;

const sampleCrossBorderReport = {
  id: 'cross-1',
  type: 'cross_border' as const,
  direction: 'kr_to_jp' as const,
  sourceSchema: 'kr' as const,
  reporter: {
    id: 'kr-1',
    name: '김민수',
    email: 'kr@test.com',
    phoneNumber: '010-1234-5678',
    age: 24,
    gender: 'MALE' as const,
    profileImageUrl: '',
    country: 'kr' as const,
    schema: 'kr' as const,
    universityName: '연세대학교',
  },
  reported: {
    id: 'jp-1',
    name: 'サクラ',
    email: 'jp@test.jp',
    phoneNumber: '',
    age: 22,
    gender: 'FEMALE' as const,
    profileImageUrl: '',
    country: 'jp' as const,
    schema: 'jp' as const,
    universityName: '早稲田大学',
  },
  reason: '외부 메신저 유도',
  description: 'LINE 아이디 요구',
  evidenceImages: ['https://img.test/cross-1.png'],
  status: 'pending' as const,
  severity: 'urgent' as const,
  category: null,
  reportCount: 2,
  chatRoomId: 'room-cross-1',
  chatRoomCountry: 'kr' as const,
  resolvedBy: null,
  resolvedByName: null,
  resolvedAt: null,
  createdAt: '2026-11-20T09:00:00.000Z',
  updatedAt: null,
};

describe('ReportsV2 deep link', () => {
  it('retains urgent and failed-notification filters in public admin requests',async()=>{
    (useSearchParams as jest.Mock).mockReturnValue({get:()=>null});
    render(<ReportsV2/>);await screen.findByRole('checkbox',{name:'긴급 신고만'});fireEvent.click(screen.getByRole('checkbox',{name:'긴급 신고만'}));await waitFor(()=>expect((mockedAdminService.getProfileReports.mock.calls.at(-1)?.[0] as URLSearchParams).get('urgent')).toBe('true'));fireEvent.click(screen.getByRole('checkbox',{name:'슬랙 미전달만'}));await waitFor(()=>expect((mockedAdminService.getProfileReports.mock.calls.at(-1)?.[0] as URLSearchParams).get('slackUndelivered')).toBe('true'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue({get:(key:string)=>key==='reportId'?'profile-pending-1':null});
    mockedAdminService.getProfileReports.mockResolvedValue({
      items: [],
      meta: { total: 0 },
    });
    mockedGetCrossBorderReports.mockResolvedValue({
      items: [],
      meta: { total: 0 },
    });
    mockedGetCrossBorderReportHistory.mockResolvedValue([]);
    mockedUpdateCrossBorderReportStatus.mockResolvedValue({ success: true });
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
    (AdminService.reports.getUserProfileImages as jest.Mock).mockResolvedValue(['https://img.test/p1.png']);
    mockedGetProfileReportHistory.mockResolvedValue([
      {
        id: 'history-1',
        reportType: 'profile',
        reportId: 'profile-pending-1',
        reviewerId: 'admin-1',
        reviewerName: '운영자A',
        previousStatus: 'reviewing',
        nextStatus: 'dismissed',
        action: 'dismissed',
        note: '허위 프로필 확인',
        createdAt: '2026-04-15T10:00:00.000Z',
      },
    ]);
  });

  it('opens the report detail dialog from the reportId query parameter', async () => {
    render(<ReportsV2 />);

    await waitFor(() => {
      expect(mockedGetProfileReportDetail).toHaveBeenCalledWith('profile-pending-1');
    });

    await waitFor(() => {
      expect(mockedGetProfileReportHistory).toHaveBeenCalledWith('profile-pending-1');
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('profile-pending-1')).toBeInTheDocument();
    expect(screen.getByText('허위 프로필')).toBeInTheDocument();
    expect(screen.getByText(/운영자A/)).toBeInTheDocument();
    expect(screen.getByText('허위 프로필 확인')).toBeInTheDocument();
    expect(screen.getByText('피신고자 사진 정보')).toBeInTheDocument();
    expect(screen.getByText(/PHOTO/)).toBeInTheDocument();
    expect(screen.getByText(/BLIND/)).toBeInTheDocument();
    expect(screen.getByTestId('blind-avatar-sources')).toBeInTheDocument();
    await waitFor(() => {
      expect(AdminService.reports.getUserProfileImages).toHaveBeenCalledWith('u-1');
    });
  });

  it('renders list rows as cards with both parties and the reason', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({ get: () => null });
    mockedAdminService.getProfileReports.mockResolvedValue({
      items: [
        {
          id: 'abcdef12-0000',
          reporter: { id: 'r-1', name: '신고자A', email: '', phoneNumber: '', age: 20, gender: 'MALE', profileImageUrl: '' },
          reported: { id: 'u-1', name: '피신고자A', email: '', phoneNumber: '', age: 21, gender: 'FEMALE', profileImageUrl: '' },
          reason: '신분사칭',
          description: null,
          evidenceImages: ['https://img.test/e.png'],
          status: 'pending',
          severity: 'urgent',
          reportCount: 3,
          createdAt: '2026-04-15T09:00:00.000Z',
          updatedAt: null,
        },
      ],
      meta: { total: 1 },
    } as never);

    render(<ReportsV2 />);

    expect(await screen.findByText('신분사칭')).toBeInTheDocument();
    expect(screen.getByText('신고자A')).toBeInTheDocument();
    expect(screen.getByText('피신고자A')).toBeInTheDocument();
    expect(screen.getByText('긴급')).toBeInTheDocument();
    expect(screen.getByText('누적 3건')).toBeInTheDocument();
    expect(screen.getByText('증거 1장')).toBeInTheDocument();
  });

  it('does not render the raw dismissed backend status string in the detail dialog', async () => {
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
      status: 'dismissed',
      createdAt: '2026-04-15T09:00:00.000Z',
      updatedAt: null,
    });

    render(<ReportsV2 />);

    await waitFor(() => {
      expect(mockedGetProfileReportDetail).toHaveBeenCalledWith('profile-pending-1');
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('dismissed')).not.toBeInTheDocument();
  });

  it('switches to the cross-border reports tab, displays direction badges, opens detail with user page links, and supports quick actions', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({ get: () => null });
    mockedGetCrossBorderReports.mockResolvedValue({
      items: [sampleCrossBorderReport],
      meta: { total: 1 },
    });
    mockedGetCrossBorderReportDetail.mockResolvedValue(sampleCrossBorderReport);

    render(<ReportsV2 />);

    const crossTab = await screen.findByRole('tab', { name: /한일\(크로스보더\) 신고/ });
    fireEvent.click(crossTab);

    expect(await screen.findByText('외부 메신저 유도')).toBeInTheDocument();
    expect(screen.getByText('🇰🇷 KR → 🇯🇵 JP')).toBeInTheDocument();
    expect(screen.getByText('김민수')).toBeInTheDocument();
    expect(screen.getByText('サクラ')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '상세 보기' }));

    await waitFor(() => {
      expect(mockedGetCrossBorderReportDetail).toHaveBeenCalledWith('cross-1');
    });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await waitFor(() => {
      expect(AdminService.reports.getUserProfileImages).toHaveBeenCalledWith('jp-1', 'jp');
    });

    const userLinks = screen.getAllByRole('link', { name: /유저 페이지/ });
    expect(userLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/admin/users/appearance?userId=kr-1&country=kr',
      '/admin/users/appearance?userId=jp-1&country=jp',
    ]);

    fireEvent.change(screen.getByPlaceholderText('조치 사유 또는 CS 확인 메모'), {
      target: { value: '외부 LINE 유도 확인 후 기각' },
    });
    fireEvent.click(screen.getByRole('button', { name: '기각 (반려)' }));

    await waitFor(() => {
      expect(mockedUpdateCrossBorderReportStatus).toHaveBeenCalledWith('cross-1', 'rejected', {
        type: 'cross_border',
        action: 'dismissed',
        note: '외부 LINE 유도 확인 후 기각',
        suspendDays: undefined,
        suspendPermanent: undefined,
        approverId: undefined,
      });
    });
  });

  it('falls back to cross-border report detail when a deep-linked reportId is missing from domestic reports', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'reportId' ? 'cross-1' : null),
    });
    mockedGetProfileReportDetail.mockRejectedValue(new AdminApiError('Not Found', 404));
    mockedGetCrossBorderReportDetail.mockResolvedValue(sampleCrossBorderReport);

    render(<ReportsV2 />);

    await waitFor(() => {
      expect(mockedGetCrossBorderReportDetail).toHaveBeenCalledWith('cross-1');
    });
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('한일 신고 상세 정보')).toBeInTheDocument();
    expect(within(dialog).getByText('kr.cross_schema_reports')).toBeInTheDocument();
  });

  it('shows a clear pending-API banner when cross-border reports endpoint returns 404', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({ get: () => null });
    mockedGetCrossBorderReports.mockRejectedValue(new AdminApiError('Not Found', 404));

    render(<ReportsV2 />);

    fireEvent.click(await screen.findByRole('tab', { name: /한일\(크로스보더\) 신고/ }));

    expect(
      await screen.findByText(/한일 신고 어드민 API/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows Korean translation alongside Japanese original description on cards and detail modal', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({ get: () => null });
    const jpCrossBorderReport = {
      ...sampleCrossBorderReport,
      id: 'cross-jp-1',
      direction: 'jp_to_kr' as const,
      sourceSchema: 'jp' as const,
      reporter: {
        ...sampleCrossBorderReport.reported,
        id: 'jp-2',
        name: 'ユイ',
        country: 'jp' as const,
        schema: 'jp' as const,
      },
      reported: {
        ...sampleCrossBorderReport.reporter,
        id: 'kr-2',
        name: '박서준',
        country: 'kr' as const,
        schema: 'kr' as const,
      },
      description: '初対面なのにLINEを強要されました',
      translatedDescription: '초면인데 LINE을 강요받았습니다',
      descriptionLanguage: 'ja',
    };
    mockedGetCrossBorderReports.mockResolvedValue({
      items: [jpCrossBorderReport],
      meta: { total: 1 },
    });
    mockedGetCrossBorderReportDetail.mockResolvedValue(jpCrossBorderReport);

    render(<ReportsV2 />);

    fireEvent.click(await screen.findByRole('tab', { name: /한일\(크로스보더\) 신고/ }));

    expect(await screen.findByText('초면인데 LINE을 강요받았습니다')).toBeInTheDocument();
    expect(screen.getByText(/원문: 初対面なのにLINEを強要されました/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '상세 보기' }));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('상세 설명 (한국어 번역)')).toBeInTheDocument();
    expect(within(dialog).getByText('초면인데 LINE을 강요받았습니다')).toBeInTheDocument();
    expect(within(dialog).getByText('상세 설명 원문 (JA)')).toBeInTheDocument();
    expect(within(dialog).getByText('初対面なのにLINEを強要されました')).toBeInTheDocument();
  });

  it('shows untranslated notice in detail modal when Japanese cross-border report has no translation', async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'reportId' ? 'cross-jp-untranslated' : null),
    });
    const untranslatedJpReport = {
      ...sampleCrossBorderReport,
      id: 'cross-jp-untranslated',
      direction: 'jp_to_kr' as const,
      sourceSchema: 'jp' as const,
      reporter: {
        ...sampleCrossBorderReport.reported,
        id: 'jp-3',
        name: 'ミホ',
        country: 'jp' as const,
        schema: 'jp' as const,
      },
      reported: {
        ...sampleCrossBorderReport.reporter,
        id: 'kr-3',
        name: '이도현',
        country: 'kr' as const,
        schema: 'kr' as const,
      },
      description: '不快なメッセージを送られました',
      translatedDescription: null,
      descriptionLanguage: 'ja',
    };
    mockedGetProfileReportDetail.mockRejectedValue(new AdminApiError('Not Found', 404));
    mockedGetCrossBorderReportDetail.mockResolvedValue(untranslatedJpReport);

    render(<ReportsV2 />);

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('不快なメッセージを送られました')).toBeInTheDocument();
    expect(within(dialog).getByText('한국어 번역 미제공 (원문 표시)')).toBeInTheDocument();
  });
});
