import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import UtmLinkList from "@/app/admin/utm-management/components/utm-link-list";
import AdminService from "@/app/services/admin";

jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: {
    utm: {
      getLinks: jest.fn(),
      updateLink: jest.fn(),
      deleteLink: jest.fn(),
    },
  },
}));

jest.mock("@/shared/ui/admin/toast", () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
    toasts: [],
  }),
}));

const mockConfirm = jest.fn();
jest.mock("@/shared/ui/admin/confirm-dialog", () => ({
  useConfirm: () => mockConfirm,
}));

describe("UtmLinkList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AdminService.utm.getLinks as jest.Mock).mockResolvedValue({
      data: [
        {
          id: "utm-link-1",
          name: "naver_blog_12_website",
          utmSource: "naver_blog",
          utmMedium: "blog",
          utmCampaign: "naver_blog_12",
          utmContent: "website",
          destinationType: "web",
          destinationUrl:
            "https://some-in-univ.com/?utm_source=naver_blog&utm_medium=blog&utm_campaign=naver_blog_12&utm_content=website",
          shortCode: "sometime-blog-12",
          shortUrl: "https://api.some-in-univ.com/go/sometime-blog-12",
          memo: null,
          createdAt: "2026-07-06T05:05:22.209Z",
          clickCount: 0,
          signupCount: 0,
          bindings: [],
        },
      ],
      meta: { total: 1, page: 1, limit: 20 },
    });
    (AdminService.utm.updateLink as jest.Mock).mockResolvedValue({});
  });

  it("shows tracking and destination URLs in the link table", async () => {
    render(<UtmLinkList refreshKey={0} />);

    expect(
      await screen.findByText(
        "https://api.some-in-univ.com/go/sometime-blog-12",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "도착: https://some-in-univ.com/?utm_source=naver_blog&utm_medium=blog&utm_campaign=naver_blog_12&utm_content=website",
      ),
    ).toBeInTheDocument();
  });
  it("hydrates a legacy JP campaign, saves its region, and preserves bindings unless edited", async () => {
    const user = userEvent.setup();
    (AdminService.utm.getLinks as jest.Mock).mockResolvedValue({
      data: [
        {
          id: "ios-link-1",
          name: "legacy-jp",
          utmSource: "tiktok",
          utmMedium: "social",
          utmCampaign: "summer_jp_launch",
          utmContent: null,
          destinationType: "appstore_ios",
          destinationUrl: "https://apps.apple.com/app/id6444733685",
          shortCode: "ios-jp",
          shortUrl: "https://links.example.com/go/ios-jp",
          memo: null,
          createdAt: "2026-07-06T00:00:00.000Z",
          bindings: [{ platform: "meta", campaignId: "campaign-1" }],
        },
      ],
      meta: { total: 1, page: 1, limit: 20 },
    });
    (AdminService.utm.updateLink as jest.Mock).mockResolvedValue({
      destinationUrl:
        "https://apps.apple.com/jp/app/id6746120889?ct=summer_jp_launch&pt=126413580&mt=8",
      shortUrl: "https://links.example.com/go/ios-jp",
    });

    render(<UtmLinkList refreshKey={0} />);

    expect(await screen.findByText("iOS 지역: JP")).toBeInTheDocument();
    await user.click(screen.getByLabelText("수정"));
    expect(
      screen.getByRole("button", { name: /App Store 지역/ }),
    ).toHaveTextContent("일본 (JP)");

    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(AdminService.utm.updateLink).toHaveBeenCalledWith(
        "ios-link-1",
        expect.objectContaining({ region: "jp" }),
      );
    });
    expect(
      (AdminService.utm.updateLink as jest.Mock).mock.calls[0][1],
    ).not.toHaveProperty("platformBindings");
    expect(
      (AdminService.utm.updateLink as jest.Mock).mock.calls[0][1],
    ).not.toHaveProperty("shortCode");
    expect(
      await screen.findByText(
        "도착: https://apps.apple.com/jp/app/id6746120889?ct=summer_jp_launch&pt=126413580&mt=8",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("https://links.example.com/go/ios-jp"),
    ).toBeInTheDocument();
  });

  it("omits region for non-iOS edits", async () => {
    const user = userEvent.setup();
    render(<UtmLinkList refreshKey={0} />);

    await screen.findByText("naver_blog_12_website");
    await user.click(screen.getByLabelText("수정"));
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(AdminService.utm.updateLink).toHaveBeenCalled();
    });
    expect(
      (AdminService.utm.updateLink as jest.Mock).mock.calls[0][1],
    ).not.toHaveProperty("region");
  });
});

it("확인 취소는 삭제하지 않고 승인 후 링크 ID로 삭제한다", async () => {
  const user = userEvent.setup();
  (AdminService.utm.getLinks as jest.Mock).mockResolvedValue({
    data: [
      {
        id: "delete-id",
        name: "캠페인 삭제",
        utmSource: "meta",
        utmMedium: "cpc",
        utmCampaign: "spring",
        destinationType: "web",
        destinationUrl: "https://example.com",
        createdAt: "2026-10-01",
        bindings: [],
      },
    ],
    meta: { total: 1 },
  });
  mockConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  render(<UtmLinkList refreshKey={0} />);
  await user.click(await screen.findByLabelText("삭제"));
  expect(mockConfirm).toHaveBeenCalledWith(
    expect.objectContaining({ title: "링크 삭제", severity: "error" }),
  );
  expect(AdminService.utm.deleteLink).not.toHaveBeenCalled();
  await user.click(screen.getByLabelText("삭제"));
  await waitFor(() =>
    expect(AdminService.utm.deleteLink).toHaveBeenCalledWith("delete-id"),
  );
});

it("다음 페이지는 서버의 1 기반 페이지로 요청한다", async () => {
  const user = userEvent.setup();
  (AdminService.utm.getLinks as jest.Mock).mockResolvedValue({
    data: [
      {
        id: "page-id",
        name: "페이지 링크",
        utmSource: "meta",
        utmMedium: "cpc",
        utmCampaign: "spring",
        destinationType: "web",
        destinationUrl: "https://example.com",
        createdAt: "2026-10-01",
        bindings: [],
      },
    ],
    meta: { total: 41 },
  });
  render(<UtmLinkList refreshKey={0} />);
  await screen.findByText("페이지 링크");
  expect(screen.getByRole("button", { name: "이전" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "다음" }));
  await waitFor(() =>
    expect(AdminService.utm.getLinks).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    ),
  );
});
