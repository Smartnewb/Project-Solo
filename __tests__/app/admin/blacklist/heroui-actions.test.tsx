import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BlacklistRegisterModal } from "@/app/admin/blacklist/components/BlacklistRegisterModal";
import { BlacklistReleaseDialog } from "@/app/admin/blacklist/components/BlacklistReleaseDialog";
import { blacklist } from "@/app/services/admin";

jest.mock("@/app/services/admin", () => ({
  blacklist: { register: jest.fn(), release: jest.fn() },
}));
const provider = (children: React.ReactNode) => (
  <QueryClientProvider
    client={
      new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    }
  >
    {children}
  </QueryClientProvider>
);

describe("HeroUI 블랙리스트 actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("사유·확인·고지 선택을 기존 등록 계약으로 전달한다", async () => {
    (blacklist.register as jest.Mock).mockResolvedValue({});
    const onClose = jest.fn();
    render(
      provider(
        <BlacklistRegisterModal
          open
          user={{ id: "user-jp", name: "유저" }}
          onClose={onClose}
        />,
      ),
    );
    const submit = await screen.findByRole("button", {
      name: "블랙리스트 등록",
    });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("사유 (필수)"), {
      target: { value: "  스팸  " },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "유저에게 고지(알림+문자) 보내기" }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "이 유저를 블랙리스트 등록합니다. 확인했습니다.",
      }),
    );
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", {name: "승인자 관리자 ID (2인 승인, 필수)"}), {target: {value: " other-admin "}});
    fireEvent.click(submit);
    await waitFor(() =>
      expect(blacklist.register).toHaveBeenCalledWith("user-jp", {
        reason: "스팸",
        memo: undefined,
        sendNotice: false,
        approverId: "other-admin",
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("해제 사유 길이를 제한하고 승인된 입력만 해제 요청한다", async () => {
    (blacklist.release as jest.Mock).mockResolvedValue({});
    render(
      provider(
        <BlacklistReleaseDialog
          open
          userId="user-kr"
          userName="유저"
          onClose={jest.fn()}
        />,
      ),
    );
    const reason = await screen.findByLabelText("해제 사유 (선택)");
    fireEvent.change(reason, { target: { value: "가".repeat(501) } });
    expect(
      screen.getByRole("button", { name: "블랙리스트 해제" }),
    ).toBeDisabled();
    fireEvent.change(reason, { target: { value: "  검토 완료  " } });
    fireEvent.click(screen.getByRole("button", { name: "블랙리스트 해제" }));
    await waitFor(() =>
      expect(blacklist.release).toHaveBeenCalledWith("user-kr", {
        releaseReason: "검토 완료",
      }),
    );
  });
});
