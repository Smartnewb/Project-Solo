import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResetPassword from "@/app/admin/reset-password/reset-password-v2";
import AdminService from "@/app/services/admin";
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: {
    userAppearance: {
      searchUsersForReset: jest.fn(),
      resetPassword: jest.fn(),
    },
  },
}));
jest.mock("@/shared/ui/admin/toast/toast-context", () => ({
  useToast: () => ({ error: jest.fn() }),
}));
it("검색과 사용자 확인 후에만 기존 초기화 API를 호출한다", async () => {
  (
    AdminService.userAppearance.searchUsersForReset as jest.Mock
  ).mockResolvedValue([
    {
      userId: "jp-user",
      name: "테스트",
      phoneNumber: "0900000000",
      status: "approved",
    },
  ]);
  (AdminService.userAppearance.resetPassword as jest.Mock).mockResolvedValue({
    temporaryPassword: "safe-test-password",
  });
  render(<ResetPassword />);
  fireEvent.change(
    screen.getByRole("textbox", { name: "이름 또는 전화번호로 검색" }),
    { target: { value: "0900000000" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "검색" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "비밀번호 초기화" }),
  );
  expect(AdminService.userAppearance.resetPassword).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "취소" }));
  expect(AdminService.userAppearance.resetPassword).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "비밀번호 초기화" }));
  fireEvent.click(screen.getAllByRole("button", { name: "초기화" }).at(-1)!);
  await waitFor(() =>
    expect(AdminService.userAppearance.resetPassword).toHaveBeenCalledWith(
      "jp-user",
    ),
  );
  expect(
    await screen.findByRole("textbox", { name: "임시 비밀번호" }),
  ).toHaveValue("safe-test-password");
  expect(AdminService.userAppearance.searchUsersForReset).toHaveBeenCalledWith({
    name: undefined,
    phoneNumber: "0900000000",
    page: 1,
    limit: 10,
  });
});
