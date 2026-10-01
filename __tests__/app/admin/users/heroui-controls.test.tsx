import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BirthdayEditModal from "@/components/admin/appearance/modals/BirthdayEditModal";
import IncludeDeletedFilter from "@/components/admin/common/IncludeDeletedFilter";

const mutateAsync = jest.fn();
let pending = false;
jest.mock("@/app/admin/hooks/use-users", () => ({
  useUpdateUserBirthday: () => ({ mutateAsync, isPending: pending }),
}));

describe("HeroUI 사용자 관리 controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pending = false;
  });

  it("탈퇴자 포함 스위치가 레이블과 연결되고 boolean 필터를 전달한다", () => {
    const onChange = jest.fn();
    render(<IncludeDeletedFilter value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch", { name: "탈퇴자 미포함" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("확인을 선택한 유효한 생년월일만 기존 mutation 계약으로 저장한다", async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    const birthday = `${new Date().getFullYear() - 22}-01-01`;
    mutateAsync.mockResolvedValue({ birthday, age: 22 });
    render(
      <BirthdayEditModal
        open
        userId="user-kr"
        userName="테스트"
        currentBirthday="2000-01-01"
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );
    fireEvent.change(await screen.findByLabelText("변경할 생년월일"), {
      target: { value: birthday },
    });
    expect(screen.getByRole("button", { name: "변경하기" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /이 유저의 생년월일과 나이를 변경합니다/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "변경하기" }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ userId: "user-kr", birthday }),
    );
    expect(onSuccess).toHaveBeenCalledWith({ birthday, age: 22 });
    expect(onClose).toHaveBeenCalled();
  });

  it("저장 중에는 수정 입력과 취소 액션을 막는다", async () => {
    pending = true;
    render(<BirthdayEditModal open userId="user-kr" onClose={jest.fn()} />);
    expect(await screen.findByLabelText("변경할 생년월일")).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
  });
});
