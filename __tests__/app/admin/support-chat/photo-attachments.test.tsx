import React from "react";
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ChatPanel from "@/app/admin/support-chat/components/ChatPanel";
import { useSupportChatSocket } from "@/app/admin/support-chat/hooks/useSupportChatSocket";
import type { SupportSessionDetail } from "@/app/types/support-chat";

jest.mock("@/shared/ui/admin/confirm-dialog", () => ({
  useConfirm: () => jest.fn().mockResolvedValue(true),
}));
const mockToastError = jest.fn();
jest.mock("@/shared/ui/admin/toast", () => ({
  useToast: () => ({
    success: jest.fn(),
    error: mockToastError,
    warning: jest.fn(),
    info: jest.fn(),
  }),
}));
jest.mock("@/shared/contexts/admin-session-context", () => ({
  useAdminSession: () => ({ session: { user: { id: "admin-1" } } }),
}));
jest.mock("@/app/services/admin", () => ({
  __esModule: true,
  default: {
    userAppearance: {
      getUserDetails: async () => ({}),
      getUserGems: async () => ({ gemBalance: 0 }),
    },
  },
}));
jest.mock("@/app/admin/support-chat/hooks/useSupportChatSocket");

function response(body: unknown, status = 200): Response {
  return { ok: status < 400, status, text: async () => JSON.stringify(body), json: async () => body } as Response;
}

const photoUrl = "https://signed.example/support-chat/session-1/a.jpg?X-Amz-Signature=x";
const session: SupportSessionDetail = {
  sessionId: "session-1",
  user: { id: "user-1", nickname: "Fixture user" },
  status: "admin_handling",
  language: "ko",
  messages: [
    {
      id: "m-photo",
      sessionId: "session-1",
      senderType: "user",
      content: "사진을 보냈어요",
      metadata: { attachments: [{ type: "image", url: photoUrl }] },
      createdAt: "2026-10-13T01:00:00Z",
    },
  ],
  createdAt: "2026-10-13T00:00:00Z",
};
const photoEndpoint = "/api/admin-proxy/support-chat/admin/sessions/session-1/photos";
const originalFetch = global.fetch;

describe("support chat photos in the admin panel", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    (useSupportChatSocket as jest.Mock).mockReturnValue({
      state: { connected: false, sessionJoined: false, error: null },
      sendMessage: jest.fn(),
      setTyping: jest.fn(),
      reconnect: jest.fn(),
    });
    fetchMock = jest.fn((url: string, init?: RequestInit) => {
      if (url === photoEndpoint && init?.method === "POST")
        return Promise.resolve(
          response({ success: true, messageId: "m2", sessionId: "session-1", createdAt: "x" }, 201),
        );
      if (url === "/api/admin-proxy/support-chat/admin/sessions/session-1")
        return Promise.resolve(response(session));
      throw new Error(`Unexpected request: ${init?.method} ${url}`);
    });
    global.fetch = fetchMock;
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  async function mount() {
    await act(async () => {
      render(<ChatPanel sessionId="session-1" onSessionUpdated={jest.fn()} />);
    });
  }

  it("shows a customer photo as an image that opens the signed original", async () => {
    await mount();
    const image = screen.getByAltText("고객 상담 사진");
    expect(image).toHaveAttribute("src", photoUrl);
    expect(screen.getByRole("link", { name: "사진 원본 열기" })).toHaveAttribute("href", photoUrl);
    expect(screen.queryByText("사진을 보냈어요")).not.toBeInTheDocument();
  });

  it("uploads one picked photo as multipart to the photo endpoint", async () => {
    await mount();
    const file = new File(["x"], "guide.png", { type: "image/png" });
    await act(async () => {
      fireEvent.change(screen.getByTestId("support-photo-input"), { target: { files: [file] } });
    });
    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(posts).toHaveLength(1);
    expect(posts[0][0]).toBe(photoEndpoint);
    expect((posts[0][1].body as FormData).get("image")).toBe(file);
  });

  it("rejects non-image files without uploading", async () => {
    await mount();
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    await act(async () => {
      fireEvent.change(screen.getByTestId("support-photo-input"), { target: { files: [file] } });
    });
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    expect(screen.getByText("10MB 이하 사진 파일만 보낼 수 있습니다.")).toBeInTheDocument();
  });
});
