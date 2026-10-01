import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Page from "@/app/admin/users/appearance/page";

jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
jest.mock("@/app/admin/hooks", () => ({ useAppearanceGradeStats: () => ({ data: null, isLoading: false, refetch: jest.fn() }) }));
jest.mock("@/components/admin/appearance/AppearanceFilterPanel", () => () => <div>승인 목록 필터</div>);
jest.mock("@/components/admin/appearance/UserAppearanceTable", () => ({ __esModule: true, default: React.forwardRef(() => <div>승인 목록</div>) }));
jest.mock("@/components/admin/appearance/UnclassifiedUsersPanel", () => () => <div>미분류 목록</div>);
jest.mock("@/components/admin/appearance/DuplicatePhoneUsersPanel", () => () => null);
jest.mock("@/components/admin/appearance/VerifiedUsersPanel", () => () => null);
jest.mock("@/components/admin/appearance/UniversityVerificationPendingPanel", () => () => null);

it("shows only the selected user list and restores the approved filters on return", () => {
  render(<Page />);
  expect(screen.getByText("승인 목록")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "미분류 사용자" }));
  expect(screen.getByText("미분류 목록")).toBeInTheDocument();
  expect(screen.queryByText("승인 목록")).not.toBeInTheDocument();
  expect(screen.queryByText("승인 목록 필터")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "승인된 사용자" }));
  expect(screen.getByText("승인 목록 필터")).toBeInTheDocument();
  expect(screen.queryByText("미분류 목록")).not.toBeInTheDocument();
});
