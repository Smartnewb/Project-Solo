import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import SessionGrid from "@/app/admin/support-chat/components/SessionGrid";
import supportChatService from "@/app/services/support-chat";
import type { SupportSessionSummary } from "@/app/types/support-chat";

jest.mock("@/app/services/support-chat", () => ({
  __esModule: true,
  default: { getSessionDetail: jest.fn(), resolveSession: jest.fn() },
}));

const sessions: SupportSessionSummary[] = [
  {
    sessionId: "older",
    userId: "u1",
    userNickname: "먼저 온 문의",
    status: "admin_handling",
    language: "ko",
    messageCount: 1,
    createdAt: "2026-09-29T01:00:00Z",
    domain: "payment",
  },
  {
    sessionId: "newer",
    userId: "u2",
    userNickname: "나중에 온 문의",
    status: "waiting_admin",
    language: "ko",
    messageCount: 1,
    createdAt: "2026-09-30T01:00:00Z",
    waitingSince: "2026-09-30T02:00:00Z",
    domain: "account",
  },
];
const props = {
  activeSessions: sessions,
  resolvedSessions: [],
  activeTab: "active" as const,
  onTabChange: jest.fn(),
  domainFilter: "all" as const,
  onDomainFilterChange: jest.fn(),
  onOpenSession: jest.fn(),
  onSessionUpdated: jest.fn(),
};

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;
Element.prototype.getAnimations = jest.fn(() => []);
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  localStorage.clear();
  jest
    .mocked(supportChatService.getSessionDetail)
    .mockImplementation(async (sessionId) => ({
      sessionId,
      user: { id: sessionId },
      status: "admin_handling",
      language: "ko",
      createdAt: "2026-09-29T01:00:00Z",
      messages: [],
    }));
  jest
    .mocked(supportChatService.resolveSession)
    .mockImplementation(async (sessionId) => ({
      success: true,
      sessionId,
      status: "admin_resolved",
      resolvedAt: "2026-10-01T01:00:00Z",
    }));
});

afterEach(() => {
  jest.useRealTimers();
});

it("keeps arrival order when status and waiting time change", async () => {
  const { container, rerender } = await act(async () =>
    render(<SessionGrid {...props} />),
  );
  const order = () =>
    screen
      .getAllByRole("button", { name: /상담 열기/ })
      .map((node) => node.textContent);
  expect(order()[0]).toContain("먼저 온 문의");
  await act(async () =>
    rerender(
      <SessionGrid
        {...props}
        activeSessions={[
          {
            ...sessions[0],
            status: "waiting_admin",
            waitingSince: "2026-10-01T03:00:00Z",
          },
          { ...sessions[1], status: "admin_handling" },
        ]}
      />,
    ),
  );
  expect(order()[0]).toContain("먼저 온 문의");
});

it("resolves only checked cards without opening or sending a closing message", async () => {
  await act(async () => render(<SessionGrid {...props} />));
  fireEvent.click(screen.getByRole("checkbox", { name: "먼저 온 문의 선택" }));
  expect(props.onOpenSession).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "선택 1건 해결 완료" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("먼저 온 문의")).toBeInTheDocument();
  expect(within(dialog).queryByText("나중에 온 문의")).not.toBeInTheDocument();
  await act(async () =>
    fireEvent.click(within(dialog).getByRole("button", { name: "해결 완료" })),
  );
  expect(supportChatService.resolveSession).toHaveBeenCalledTimes(1);
  expect(supportChatService.resolveSession).toHaveBeenCalledWith("older", {
    resolutionReason: "solved",
  });
  expect(props.onSessionUpdated).toHaveBeenCalledTimes(1);
});

it("does not resolve canceled or unchecked selections", async () => {
  await act(async () => render(<SessionGrid {...props} />));
  const checkbox = screen.getByRole("checkbox", { name: "먼저 온 문의 선택" });
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole("button", { name: "선택 1건 해결 완료" }));
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "취소" }),
  );
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  fireEvent.click(checkbox);
  expect(
    screen.getByRole("button", { name: "선택 0건 해결 완료" }),
  ).toBeDisabled();
  expect(supportChatService.resolveSession).not.toHaveBeenCalled();
});

it("clears hidden selections when a filter changes", async () => {
  const { rerender } = await act(async () =>
    render(<SessionGrid {...props} />),
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "먼저 온 문의 선택" }));
  await act(async () =>
    rerender(<SessionGrid {...props} domainFilter="account" />),
  );
  expect(
    screen.getByRole("button", { name: "선택 0건 해결 완료" }),
  ).toBeDisabled();
});

it("retains only failed selections and never retries successful sessions", async () => {
  jest
    .mocked(supportChatService.resolveSession)
    .mockResolvedValueOnce({
      success: true,
      sessionId: "older",
      status: "admin_resolved",
      resolvedAt: "2026-10-01T01:00:00Z",
    })
    .mockRejectedValueOnce(new Error("connection lost"));
  await act(async () => render(<SessionGrid {...props} />));
  fireEvent.click(screen.getByRole("checkbox", { name: "먼저 온 문의 선택" }));
  fireEvent.click(
    screen.getByRole("checkbox", { name: "나중에 온 문의 선택" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "선택 2건 해결 완료" }));
  await act(async () =>
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "해결 완료",
      }),
    ),
  );
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(
    screen.getByRole("checkbox", { name: "먼저 온 문의 선택" }),
  ).not.toBeChecked();
  expect(
    screen.getByRole("checkbox", { name: "나중에 온 문의 선택" }),
  ).toBeChecked();
  expect(screen.getByRole("alert")).toHaveTextContent("1건 완료, 1건 실패");
  expect(supportChatService.resolveSession).toHaveBeenCalledTimes(2);
});
