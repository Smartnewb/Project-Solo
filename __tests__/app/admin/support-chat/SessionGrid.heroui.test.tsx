import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SessionGrid from "@/app/admin/support-chat/components/SessionGrid";
import supportChatService from "@/app/services/support-chat";
jest.mock("@/app/services/support-chat", () => ({
  __esModule: true,
  default: { getSessionDetail: jest.fn() },
}));
jest.mock("@/app/admin/support-chat/lib/read-state", () => ({
  useReadState: () => ({ isUnread: () => false, markRead: jest.fn() }),
}));
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;
Element.prototype.getAnimations = jest.fn(() => []);
it("상담 카드 Enter 입력은 해당 세션을 한 번 연다", async () => {
  const user = userEvent.setup();
  const open = jest.fn();
  (supportChatService.getSessionDetail as jest.Mock).mockResolvedValue({
    messages: [],
  });
  render(
    <SessionGrid
      activeSessions={[
        {
          sessionId: "card-session",
          userId: "user",
          userNickname: "상담 카드",
          status: "waiting_admin",
          language: "ko",
          messageCount: 0,
          createdAt: "2026-10-01",
        },
      ]}
      resolvedSessions={[]}
      activeTab="active"
      onTabChange={jest.fn()}
      domainFilter="all"
      onDomainFilterChange={jest.fn()}
      onOpenSession={open}
    />,
  );
  await waitFor(() =>
    expect(supportChatService.getSessionDetail).toHaveBeenCalledWith(
      "card-session",
    ),
  );
  const card = screen.getByRole("button", { name: /상담 카드/ });
  act(() => card.focus());
  await user.keyboard("{Enter}");
  expect(open).toHaveBeenCalledTimes(1);
  expect(open).toHaveBeenCalledWith("card-session");
});
