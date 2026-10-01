import { act, renderHook } from "@testing-library/react";
import { io } from "socket.io-client";
import { useSupportChatSocket } from "@/app/admin/support-chat/hooks/useSupportChatSocket";

jest.mock("socket.io-client", () => ({ io: jest.fn() }));

const mockedIo = io as jest.Mock;
const deviceId = "12345678-1234-4123-8123-123456789abc";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function tokenResponse(token = "admin-token") {
  return { ok: true, json: async () => ({ accessToken: token }) } as Response;
}

function handshake(index = 0) {
  const callback = jest.fn();
  mockedIo.mock.calls[index][1].auth(callback);
  return callback.mock.calls[0][0];
}

describe("useSupportChatSocket handshake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: jest.fn(() => deviceId),
    });
    global.fetch = jest.fn().mockResolvedValue(tokenResponse());
    mockedIo.mockImplementation(() => ({
      connected: false,
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it("sends the existing browser device ID alongside the bearer token", async () => {
    localStorage.setItem("admin_device_id", deviceId);
    await act(async () => {
      renderHook(() => useSupportChatSocket({ sessionId: "session-1" }));
    });

    expect(mockedIo).toHaveBeenCalledTimes(1);
    expect(mockedIo.mock.calls[0][0]).toMatch(/\/support-chat$/);
    expect(handshake()).toEqual({ token: "Bearer admin-token", deviceId });
    expect(globalThis.crypto.randomUUID).not.toHaveBeenCalled();
  });

  it("persists a generated ID across reconnects, repeated handshakes and remounts", async () => {
    const hook = renderHook(() =>
      useSupportChatSocket({ sessionId: "session-1" }),
    );
    await act(async () => {});
    expect(handshake()).toEqual({ token: "Bearer admin-token", deviceId });
    expect(localStorage.getItem("admin_device_id")).toBe(deviceId);
    expect(handshake()).toEqual(handshake());

    await act(async () => {
      hook.result.current.reconnect();
    });
    expect(mockedIo.mock.results[0].value.disconnect).toHaveBeenCalledTimes(1);
    expect(handshake(1)).toEqual(handshake(0));
    hook.unmount();
    await act(async () => {
      renderHook(() => useSupportChatSocket({ sessionId: "session-2" }));
    });
    expect(handshake(2)).toEqual(handshake(0));
    expect(globalThis.crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("does not create an orphan socket when unmounted during token retrieval", async () => {
    const response = deferred<Response>();
    (global.fetch as jest.Mock).mockReturnValueOnce(response.promise);
    const hook = renderHook(() =>
      useSupportChatSocket({ sessionId: "session-1" }),
    );
    hook.unmount();

    await act(async () => {
      response.resolve(tokenResponse());
      await response.promise;
    });
    expect(mockedIo).not.toHaveBeenCalled();
  });

  it("only creates the current session socket when an older token request finishes late", async () => {
    const response = deferred<Response>();
    (global.fetch as jest.Mock).mockReturnValueOnce(response.promise);
    const hook = renderHook(
      ({ sessionId }) => useSupportChatSocket({ sessionId }),
      {
        initialProps: { sessionId: "session-1" },
      },
    );
    await act(async () => {
      hook.rerender({ sessionId: "session-2" });
    });
    expect(mockedIo).toHaveBeenCalledTimes(1);

    await act(async () => {
      response.resolve(tokenResponse());
      await response.promise;
    });
    expect(mockedIo).toHaveBeenCalledTimes(1);
    const connectHandler = mockedIo.mock.results[0].value.on.mock.calls.find(
      ([event]: [string]) => event === "connect",
    )[1];
    act(() => {
      connectHandler();
    });
    expect(mockedIo.mock.results[0].value.emit).toHaveBeenCalledWith(
      "join_session",
      { sessionId: "session-2" },
      expect.any(Function),
    );
  });
});
