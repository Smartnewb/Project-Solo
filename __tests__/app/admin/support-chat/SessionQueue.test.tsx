import React from "react";
import userEvent from "@testing-library/user-event";
jest.mock("@/shared/contexts/admin-session-context", () => ({
  useAdminSession: () => ({ session: { user: { id: "admin-fixture" } } }),
}));
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SessionQueue from "@/app/admin/support-chat/components/SessionQueue";
import type { SupportSessionSummary } from "@/app/types/support-chat";

function makeSession(
  overrides: Partial<SupportSessionSummary> = {},
): SupportSessionSummary {
  return {
    sessionId: "session-1",
    userId: "user-1",
    userNickname: "테스트 유저",
    status: "waiting_admin",
    language: "ko",
    messageCount: 1,
    lastMessage: "추가 문의입니다",
    createdAt: "2026-04-18T00:00:00.000Z",
    ...overrides,
  };
}

describe("SessionQueue", () => {
  const dateNowSpy = jest.spyOn(Date, "now");

  afterEach(() => {
    dateNowSpy.mockReset();
  });

  afterAll(() => {
    dateNowSpy.mockRestore();
  });

  it("uses waitingSince instead of createdAt for waiting duration", () => {
    dateNowSpy.mockReturnValue(new Date("2026-04-18T00:12:00.000Z").getTime());

    render(
      <SessionQueue
        activeSessions={[
          makeSession({
            createdAt: "2026-04-18T00:00:00.000Z",
            waitingSince: "2026-04-18T00:10:00.000Z",
          }),
        ]}
        resolvedSessions={[]}
        selectedSessionId={null}
        onSelectSession={jest.fn()}
        activeTab="active"
        onTabChange={jest.fn()}
        domainFilter="all"
        onDomainFilterChange={jest.fn()}
        newSessionIds={new Set()}
        onClearNewSessionIds={jest.fn()}
        unreadMap={{}}
      />,
    );

    expect(screen.getByText("2분")).toBeInTheDocument();
    expect(screen.queryByText("12분")).not.toBeInTheDocument();
  });
});

it("상담 행은 키보드 Enter로 선택한다", async () => {
  const user = userEvent.setup();
  const select = jest.fn();
  render(
    <SessionQueue
      activeSessions={[makeSession()]}
      resolvedSessions={[]}
      selectedSessionId={null}
      onSelectSession={select}
      activeTab="active"
      onTabChange={jest.fn()}
      domainFilter="all"
      onDomainFilterChange={jest.fn()}
      newSessionIds={new Set()}
      onClearNewSessionIds={jest.fn()}
      unreadMap={{}}
    />,
  );
  const row = screen.getByRole("button", { name: /테스트 유저/ });
  act(() => row.focus());
  await user.keyboard("{Enter}");
  expect(select).toHaveBeenCalledTimes(1);
  expect(select).toHaveBeenCalledWith("session-1");
});
