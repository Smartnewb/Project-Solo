import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UtmManagement from "@/app/admin/utm-management/utm-management";
jest.mock(
  "@/app/admin/utm-management/components/utm-link-creator",
  () =>
    function Creator(props: { onCreated: () => void }) {
      return <button onClick={props.onCreated}>테스트 생성 완료</button>;
    },
);
jest.mock(
  "@/app/admin/utm-management/components/utm-link-list",
  () =>
    function List(props: { refreshKey: number }) {
      return <div>목록 갱신 {props.refreshKey}</div>;
    },
);
jest.mock(
  "@/app/admin/utm-management/components/utm-dashboard",
  () =>
    function Dashboard() {
      return <div>대시보드 내용</div>;
    },
);
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.getAnimations = () => [];
});
it("refreshes links after creation and keeps inactive tab data unmounted", async () => {
  const user = userEvent.setup();
  render(<UtmManagement />);
  expect(screen.getByText("목록 갱신 0")).toBeTruthy();
  expect(screen.queryByText("대시보드 내용")).toBeNull();
  await user.click(screen.getByRole("button", { name: "테스트 생성 완료" }));
  expect(screen.getByText("목록 갱신 1")).toBeTruthy();
  await user.click(screen.getByRole("tab", { name: "성과 대시보드" }));
  expect(screen.getByText("대시보드 내용")).toBeTruthy();
  expect(screen.queryByText("목록 갱신 1")).toBeNull();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByText("목록 갱신 1")).toBeTruthy();
});
it("preserves the dashboard route initial tab contract", () => {
  render(<UtmManagement initialTab={1} />);
  expect(
    screen
      .getByRole("tab", { name: "성과 대시보드" })
      .getAttribute("aria-selected"),
  ).toBe("true");
  expect(screen.getByText("대시보드 내용")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "테스트 생성 완료" })).toBeNull();
});
