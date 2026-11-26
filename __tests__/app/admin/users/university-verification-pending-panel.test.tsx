import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UniversityVerificationPendingPanel from "@/components/admin/appearance/UniversityVerificationPendingPanel";
import AdminService from "@/app/services/admin";

jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: {
    userAppearance: {
      getUniversityVerificationPending: jest.fn(),
      approveUniversityVerification: jest.fn(),
      rejectUniversityVerification: jest.fn(),
      getUserDetails: jest.fn(),
    },
  },
}));

jest.mock("@/shared/ui/admin/toast", () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}));

jest.mock("@/components/admin/appearance/UserDetailModal", () => () => null);

const mockedGetPending = AdminService.userAppearance
  .getUniversityVerificationPending as jest.Mock;

describe("UniversityVerificationPendingPanel two-tab split", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  it("loads pending queue by default and switches to OCR post_review tab with distinct labels", async () => {
    mockedGetPending
      .mockResolvedValueOnce({
        users: [
          {
            id: "user-pending",
            name: "미심사학생",
            email: "a@test.com",
            phoneNumber: "010-0000-0001",
            universityName: "서울대학교",
            departmentName: "컴퓨터공학부",
            grade: "3",
            studentNumber: "20240001",
            certificateImageUrl: "https://cdn/1.jpg",
            createdAt: "2026-11-26T04:00:00.000Z",
            verifiedAt: null,
            isPostReview: false,
            type: "university",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        queue: "pending",
        counts: { pending: 1, postReview: 2 },
      })
      .mockResolvedValueOnce({
        users: [
          {
            id: "user-post",
            name: "자동승인학생",
            email: "b@test.com",
            phoneNumber: "010-0000-0002",
            universityName: "연세대학교",
            departmentName: "경영학과",
            grade: "2",
            studentNumber: "20250002",
            certificateImageUrl: "https://cdn/2.jpg",
            createdAt: "2026-11-26T04:05:00.000Z",
            verifiedAt: "2026-11-26T04:05:01.000Z",
            isPostReview: true,
            type: "university",
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        queue: "post_review",
        counts: { pending: 1, postReview: 2 },
      });

    render(<UniversityVerificationPendingPanel />);

    expect(await screen.findByText("미심사학생")).toBeInTheDocument();
    expect(mockedGetPending).toHaveBeenCalledWith(
      expect.objectContaining({ queue: "pending", page: 1 }),
    );
    expect(screen.getByRole("button", { name: "승인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "거절" })).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("tab", { name: /OCR 자동승인 · 사후확인/ }),
    );

    expect(await screen.findByText("자동승인학생")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedGetPending).toHaveBeenCalledWith(
        expect.objectContaining({ queue: "post_review", page: 1 }),
      );
    });
    expect(
      screen.getByRole("button", { name: "확인 완료" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "승인 취소" }),
    ).toBeInTheDocument();
  });
});
