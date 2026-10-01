import React, { useState } from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { GhostCardView } from "@/app/admin/ai-profiles/ghosts/ghost-card-view";
import type { GhostListItem } from "@/app/types/ghost-injection";
const ghost: GhostListItem = {
  ghostAccountId: "ghost-account",
  ghostUserId: "ghost-user",
  name: "검토 프로필",
  age: 22,
  gender: "FEMALE",
  mbti: "INTJ",
  rank: "A",
  status: "ACTIVE",
  isExhausted: false,
  university: null,
  department: null,
  primaryPhotoUrl: "https://example.test/photo.png",
  photoCount: 2,
  lastExposedAt: null,
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
};
it("체크박스 마우스/Space 선택과 상태 변경은 상세 열기와 분리한다", async () => {
  const user = userEvent.setup();
  const detail = jest.fn();
  const status = jest.fn();
  const selection = jest.fn();
  function Harness() {
    const [ids, setIds] = useState(new Set<string>());
    return (
      <GhostCardView
        items={[ghost]}
        isLoading={false}
        selectedIds={ids}
        onCardClick={detail}
        onToggleStatus={status}
        onToggleSelect={(id) => {
          selection(id);
          setIds((current) => (current.has(id) ? new Set() : new Set([id])));
        }}
      />
    );
  }
  render(<Harness />);
  const checkbox = screen.getByRole("checkbox", { name: "검토 프로필 선택" });
  await user.click(checkbox);
  expect(checkbox).toBeChecked();
  expect(selection).toHaveBeenLastCalledWith("ghost-account");
  expect(detail).not.toHaveBeenCalled();
  act(() => checkbox.focus());
  await user.keyboard(" ");
  expect(checkbox).not.toBeChecked();
  expect(selection).toHaveBeenCalledTimes(2);
  expect(detail).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "비활성화" }));
  expect(status).toHaveBeenCalledWith(ghost);
  expect(detail).not.toHaveBeenCalled();
  const open = screen.getByRole("button", {
    name: "검토 프로필 프로필 상세 보기",
  });
  act(() => open.focus());
  await user.keyboard("{Enter}");
  expect(detail).toHaveBeenCalledTimes(1);
  expect(detail).toHaveBeenCalledWith(ghost);
  await user.click(
    screen.getByRole("button", { name: "검토 프로필 사진 상세 보기" }),
  );
  expect(detail).toHaveBeenCalledTimes(2);
  expect(selection).toHaveBeenCalledTimes(2);
});
