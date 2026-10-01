import React from "react";
import userEvent from "@testing-library/user-event";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SessionQueue from "@/app/admin/support-chat/components/SessionQueue";
import type { SupportSessionSummary } from "@/app/types/support-chat";
import supportChatService from "@/app/services/support-chat";

jest.mock("@/shared/contexts/admin-session-context", () => ({
  useAdminSession: () => ({ session: null }),
}));
jest.mock("@/app/services/support-chat", () => ({
  __esModule: true,
  default: { getSessionDetail: jest.fn() },
}));

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
  beforeEach(() => {
    jest
      .mocked(supportChatService.getSessionDetail)
      .mockImplementation(async (sessionId) => ({
        sessionId,
        user: { id: "user" },
        status: "waiting_admin",
        language: "ko",
        messages: [],
        createdAt: "2026-04-18T00:00:00Z",
      }));
  });

  afterEach(() => {
    dateNowSpy.mockReset();
  });

  afterAll(() => {
    dateNowSpy.mockRestore();
  });

  it("uses waitingSince instead of createdAt for waiting duration", async () => {
    dateNowSpy.mockReturnValue(new Date("2026-04-18T00:12:00.000Z").getTime());

    await act(async () =>
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
          onSessionUpdated={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText("2분")).toBeInTheDocument();
    expect(screen.queryByText("12분")).not.toBeInTheDocument();
  });

  it("keeps oldest arrival first and selecting does not open the conversation", async () => {
    dateNowSpy.mockReturnValue(new Date("2026-04-18T00:12:00Z").getTime());
    const onSelectSession = jest.fn();
    const { container } = await act(async () =>
      render(
        <SessionQueue
          activeSessions={[
            makeSession({
              sessionId: "new",
              userNickname: "새 문의",
              createdAt: "2026-04-18T00:10:00Z",
            }),
            makeSession({
              sessionId: "old",
              userNickname: "이전 문의",
              status: "admin_handling",
            }),
          ]}
          resolvedSessions={[]}
          selectedSessionId={null}
          onSelectSession={onSelectSession}
          activeTab="active"
          onTabChange={jest.fn()}
          domainFilter="all"
          onDomainFilterChange={jest.fn()}
          newSessionIds={new Set()}
          onClearNewSessionIds={jest.fn()}
          onSessionUpdated={jest.fn()}
        />,
      ),
    );
    expect(
      screen.getAllByRole("button", { name: /상담 열기/ })[0],
    ).toHaveAccessibleName("이전 문의 상담 열기");
    fireEvent.click(screen.getByRole("checkbox", { name: "이전 문의 선택" }));
    expect(onSelectSession).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "선택 1건 해결 완료" }),
    ).toBeEnabled();
  });
});

it("상담 행은 키보드 Enter로 한 번 연다", async () => {
  const user = userEvent.setup();
  const select = jest.fn();
  jest
    .mocked(supportChatService.getSessionDetail)
    .mockResolvedValue({
      sessionId: "session-1",
      user: { id: "user-1" },
      status: "waiting_admin",
      language: "ko",
      messages: [],
      createdAt: "2026-04-18T00:00:00Z",
    });
  await act(async () =>
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
        onSessionUpdated={jest.fn()}
      />,
    ),
  );
  const row = screen.getByRole("button", { name: "테스트 유저 상담 열기" });
  act(() => row.focus());
  await user.keyboard("{Enter}");
  expect(select).toHaveBeenCalledTimes(1);
  expect(select).toHaveBeenCalledWith("session-1");
});
