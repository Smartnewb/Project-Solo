import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BulkResolveToolbar from "@/app/admin/support-chat/components/BulkResolveToolbar";
import service from "@/app/services/support-chat";
import type { SupportSessionSummary } from "@/app/types/support-chat";

jest.mock("@/app/services/support-chat", () => ({
  __esModule: true,
  default: { resolveSession: jest.fn() },
}));
const resolveSession = service.resolveSession as jest.Mock;
const selected: SupportSessionSummary[] = Array.from({ length: 9 }, (_, i) => ({
  sessionId: String(i), userId: String(i), messageCount: 1,
  language: "ko", status: "waiting_admin", createdAt: "2026-10-01",
}));
function deferred() {
  let resolve!: (value: { success: boolean }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ success: boolean }>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
beforeEach(() => resolveSession.mockReset());

function setup() {
  const pending = selected.map(deferred);
  let active = 0;
  let maximum = 0;
  resolveSession.mockImplementation((id: string) => {
    active++;
    maximum = Math.max(maximum, active);
    return pending[Number(id)].promise.finally(() => active--);
  });
  const props = { selected, scope: "active:all", setSelectedIds: jest.fn(), onSessionUpdated: jest.fn() };
  const view = render(<BulkResolveToolbar {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "선택 9건 해결 완료" }));
  fireEvent.click(screen.getByRole("button", { name: "해결 완료" }));
  return { pending, props, view, maximum: () => maximum, active: () => active };
}

it("limits bulk requests to four and preserves completed/failed results", async () => {
  const run = setup();
  expect(resolveSession).toHaveBeenCalledTimes(4);
  for (let i = 0; i < run.pending.length; i++) {
    await act(async () => {
      if (i === 1) run.pending[i].reject(new Error("unavailable"));
      else run.pending[i].resolve({ success: i !== 7 });
    });
  }
  expect(run.maximum()).toBe(4);
  expect(run.active()).toBe(0);
  expect(resolveSession).toHaveBeenCalledTimes(9);
  expect(run.props.setSelectedIds).toHaveBeenCalledWith(["1", "7"]);
  expect(run.props.onSessionUpdated).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert")).toHaveTextContent("7건 완료, 2건 실패");
});

it.each(["scope", "unmount"])("does not start queued resolves or publish stale results after %s", async (change) => {
  const run = setup();
  expect(resolveSession).toHaveBeenCalledTimes(4);
  if (change === "scope") run.view.rerender(<BulkResolveToolbar {...run.props} scope="active:payment" />);
  else run.view.unmount();
  await act(async () => run.pending.slice(0, 4).forEach((request) => request.resolve({ success: true })));
  expect(resolveSession).toHaveBeenCalledTimes(4);
  expect(run.props.setSelectedIds).not.toHaveBeenCalled();
  expect(run.props.onSessionUpdated).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  if (change === "scope") {
    expect(screen.getByRole("button", { name: "선택 9건 해결 완료" })).toBeEnabled();
  }
});
