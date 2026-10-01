import { act, renderHook } from "@testing-library/react";
import { useReadState } from "@/app/admin/support-chat/lib/read-state";
import type { SupportMessage } from "@/app/types/support-chat";

const key = "support-chat:user-read-state:v1";
const message = (
  id: string,
  senderType: SupportMessage["senderType"],
  minute = 0,
): SupportMessage => ({
  id,
  sessionId: "s",
  senderType,
  content: id,
  createdAt: `2026-10-01T00:${String(minute).padStart(2, "0")}:00Z`,
});

beforeEach(() => {
  localStorage.clear();
});

it("tracks only new user replies, including equal-count replacement, and persists across remounts", () => {
  localStorage.setItem("support-chat:read-state", JSON.stringify({ s: 99 }));
  const first = renderHook(() => useReadState());
  const user = message("user-1", "user");
  expect(first.result.current.isUnread("s", [])).toBe(false);
  expect(first.result.current.isUnread("s", [message("bot", "bot")])).toBe(
    false,
  );
  expect(first.result.current.isUnread("s", [user])).toBe(true);
  act(() => first.result.current.markRead("s", [user]));
  expect(
    first.result.current.isUnread("s", [
      user,
      message("admin", "admin", 1),
      message("bot", "bot", 2),
    ]),
  ).toBe(false);
  expect(
    first.result.current.isUnread("s", [message("user-2", "user", 3)]),
  ).toBe(true);
  first.unmount();
  const reloaded = renderHook(() => useReadState());
  expect(reloaded.result.current.isUnread("s", [user])).toBe(false);
  expect(
    reloaded.result.current.isUnread("s", [message("user-2", "user", 3)]),
  ).toBe(true);
});

it("synchronizes hook instances and browser storage events without overwriting other sessions", () => {
  const first = renderHook(() => useReadState());
  const second = renderHook(() => useReadState());
  const user = message("user", "user");
  act(() => first.result.current.markRead("s", [user]));
  expect(second.result.current.isUnread("s", [user])).toBe(false);
  act(() => second.result.current.markRead("other", [user]));
  expect(JSON.parse(localStorage.getItem(key)!)).toHaveProperty("s.id", "user");
  act(() => {
    localStorage.setItem(
      key,
      JSON.stringify({
        s: { id: "new", createdAt: message("new", "user", 2).createdAt },
      }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });
  expect(first.result.current.isUnread("s", [message("new", "user", 2)])).toBe(
    false,
  );
  act(() => first.result.current.markRead("s", [user]));
  expect(JSON.parse(localStorage.getItem(key)!).s.id).toBe("new");
});

it("ignores malformed storage and recognizes distinct user identities at the same timestamp", () => {
  localStorage.setItem(key, JSON.stringify({ s: 12, other: null }));
  const { result } = renderHook(() => useReadState());
  const user = message("one", "user");
  expect(result.current.isUnread("s", [user])).toBe(true);
  act(() => result.current.markRead("s", [user]));
  expect(result.current.isUnread("s", [user, message("two", "user")])).toBe(
    true,
  );
});
