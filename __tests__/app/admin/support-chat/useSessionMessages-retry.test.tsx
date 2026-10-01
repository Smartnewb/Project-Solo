import { act, renderHook } from "@testing-library/react";
import { useSessionMessages } from "@/app/admin/support-chat/hooks/useSessionMessages";
import service from "@/app/services/support-chat";
import type { SupportSessionSummary } from "@/app/types/support-chat";

jest.mock("@/app/services/support-chat", () => ({
  __esModule: true,
  default: { getSessionDetail: jest.fn() },
}));

it("retries a failed detail only on the next sessions update even when the count is unchanged", async () => {
  const summary: SupportSessionSummary = {
    sessionId: "a",
    messageCount: 1,
    userId: "u",
    language: "ko",
    status: "waiting_admin",
    createdAt: "2026-10-01T00:00:00Z",
  };
  const fetchDetail = service.getSessionDetail as jest.Mock;
  fetchDetail
    .mockRejectedValueOnce(new Error("unavailable"))
    .mockResolvedValueOnce({ sessionId: "a", messages: [] });
  const hook = renderHook(({ sessions }) => useSessionMessages(sessions), {
    initialProps: { sessions: [summary] },
  });
  await act(async () => {});
  expect(fetchDetail).toHaveBeenCalledTimes(1);
  expect(hook.result.current.errorsBySession.a).toBe("unavailable");
  await act(async () => hook.rerender({ sessions: [{ ...summary }] }));
  expect(fetchDetail).toHaveBeenCalledTimes(2);
  expect(hook.result.current.errorsBySession).toEqual({});
  expect(hook.result.current.messagesBySession.a).toEqual([]);
});
