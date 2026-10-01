import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import UserAppearanceTable from "@/components/admin/appearance/UserAppearanceTable";
import UnclassifiedUsersTable from "@/components/admin/appearance/UnclassifiedUsersTable";
import AdminService from "@/app/services/admin";
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: { userAppearance: { getUsersWithAppearanceGrade: jest.fn() } },
}));
jest.mock("@/components/admin/appearance/UserDetailModal", () => ({
  __esModule: true,
  default: () => null,
}));
const userFixture: any = {
  id: "user-fixture",
  userId: "user-fixture",
  name: "확인 사용자",
  gender: "FEMALE",
  age: 22,
  appearanceGrade: "UNKNOWN",
  profileImages: [],
  createdAt: "2026-10-01",
};
it.each(["전체", "미분류"])(
  "%s 테이블 헤더 체크박스를 키보드로 선택한다",
  async (kind) => {
    const user = userEvent.setup();
    (
      AdminService.userAppearance.getUsersWithAppearanceGrade as jest.Mock
    ).mockResolvedValue({ data: [userFixture], meta: { total: 1 } });
    if (kind === "전체") render(<UserAppearanceTable />);
    else
      render(
        <UnclassifiedUsersTable
          users={[userFixture]}
          loading={false}
          error={null}
          cohort="GRADE_REQUIRED"
          totalCount={1}
          page={0}
          pageSize={10}
          onPageChange={jest.fn()}
          onRefresh={jest.fn()}
          onUsersRemove={jest.fn()}
        />,
      );
    await screen.findByText("확인 사용자");
    if (kind === "전체")
      expect(screen.getByRole("button", { name: /행 수/ })).toHaveAttribute(
        "aria-haspopup",
        "listbox",
      );
    const header = screen.getAllByRole("checkbox")[0];
    expect(header).not.toBeChecked();
    act(() => header.focus());
    await user.keyboard(" ");
    await waitFor(() => expect(header).toBeChecked());
    expect(screen.getAllByRole("checkbox")[1]).toBeChecked();
  },
);
