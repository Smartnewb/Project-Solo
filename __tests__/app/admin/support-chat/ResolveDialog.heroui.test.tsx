import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ResolveDialog from "@/app/admin/support-chat/components/ResolveDialog";
it("빈 종료 문구를 차단하고 스위치를 끄면 메시지 없이 선택 사유로 완료한다", () => {
  const onConfirm = jest.fn();
  render(
    <ResolveDialog
      open
      loading={false}
      onClose={jest.fn()}
      onConfirm={onConfirm}
    />,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "종료 메시지" }), {
    target: { value: "  " },
  });
  expect(screen.getByRole("button", { name: "해결 완료" })).toBeDisabled();
  fireEvent.click(screen.getByRole("switch", { name: "종료 메시지 전송" }));
  fireEvent.click(screen.getByRole("button", { name: "기타" }));
  fireEvent.click(screen.getByRole("button", { name: "해결 완료" }));
  expect(onConfirm).toHaveBeenCalledWith({
    closingMessage: undefined,
    resolutionReason: "other",
  });
});
