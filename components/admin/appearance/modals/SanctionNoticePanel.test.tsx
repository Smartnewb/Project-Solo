import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminService from "@/app/services/admin";
import SanctionNoticePanel from "./SanctionNoticePanel";
import type { SanctionNoticePreview } from "@/app/services/admin/users";

const preview: SanctionNoticePreview = {
  sanctionId: "s1", kind: "period", reason: "괴롭힘", suspendedUntil: "2026-10-11T00:00:00Z", maskedPhone: "010-****-1234",
  balanceSummary: null, paymentGroups: [], reviewReasons: [], text: "7일 정지 / 사유: 괴롭힘 / 소명 방법", templateVersion: "sanction-refund-v1", snapshotHash: "hash1", noticeStatus: "awaiting_notice", outboxId: null, retryAllowed: false,
};
const api = AdminService.userAppearance;
let load: jest.SpyInstance;
let suspend: jest.SpyInstance;
let send: jest.SpyInstance;
beforeEach(() => {
 load = jest.spyOn(api, "getSanctionNoticePreview").mockResolvedValue(preview);
 suspend = jest.spyOn(api, "suspendUser").mockResolvedValue({ sanctionId: "s1" });
 send = jest.spyOn(api, "sendSanctionNotice").mockResolvedValue({ noticeStatus: "submitted", outboxId: "o1", retryAllowed: false });
});
afterEach(() => jest.restoreAllMocks());
const props = { userId: "u1", country: "kr" as const, userName: "테스트", isSuspended: false };

async function apply(user: ReturnType<typeof userEvent.setup>) {
 await user.type(screen.getByLabelText("회원 공개 정지 사유"), "괴롭힘");
 await user.click(screen.getByRole("button", { name: "정지 적용" }));
 await user.click(screen.getByRole("button", { name: "확인 후 정지 적용" }));
}

test("기간 정지는 준비 모드로 적용하고 원장 없이 서버 문안을 확인한 후에만 발송한다", async () => {
 const user = userEvent.setup();
 render(<SanctionNoticePanel {...props} />);
 await user.type(screen.getByLabelText("내부 메모"), "내부 증거");
 await apply(user);
 await screen.findByLabelText("서버 안내 문안");
 expect(suspend).toHaveBeenCalledWith("u1", { reason: "괴롭힘", note: "내부 증거", noticeMode: "prepare", durationDays: 7 });
 expect(screen.queryByLabelText("환불 원장")).not.toBeInTheDocument();
 expect(send).not.toHaveBeenCalled();
 await user.click(screen.getByRole("button", { name: "LMS 안내 발송" }));
 await screen.findByText("문자 안내: 공급자 접수 완료");
 expect(send).toHaveBeenCalledWith("u1", "s1", { snapshotHash: "hash1", templateVersion: "sanction-refund-v1" });
 expect(screen.getByRole("button", { name: "LMS 안내 발송" })).toBeDisabled();
});

test("정지가 성공하고 원장 조회가 실패해도 안내 조회만 재시도한다", async () => {
 const user = userEvent.setup();
 load.mockRejectedValueOnce(new Error("원장 조회 오류"));
 render(<SanctionNoticePanel {...props} />);
 await apply(user);
 await screen.findByText(/정지 완료\. 원장 조회 오류/);
 expect(screen.queryByRole("button", { name: "정지 적용" })).not.toBeInTheDocument();
 await user.click(screen.getByRole("button", { name: "안내 다시 조회" }));
 await screen.findByLabelText("서버 안내 문안");
 expect(suspend).toHaveBeenCalledTimes(1);
});

test("무기한 혼합 플랫폼의 원장과 링크를 표시하며 재진입 시 정지를 반복하지 않는다", async () => {
 load.mockResolvedValue({ ...preview, kind: "indefinite", suspendedUntil: null, balanceSummary: { balance: 50, paid: 40, free: 10, unknown: 0 }, paymentGroups: [
  { paymentId: "p1", platform: "APPLE", paidAt: "2026-10-01T00:00:00Z", currency: "KRW", paymentAmount: 24900, quantity: 500, remainingQuantity: 30, referenceAmount: 1494, refundUrl: "https://reportaproblem.apple.com" },
  { paymentId: "p2", platform: "GOOGLE", paidAt: "2026-10-01T00:00:00Z", currency: "KRW", paymentAmount: 12900, quantity: 130, remainingQuantity: 10, referenceAmount: 992, refundUrl: "https://support.google.com/googleplay/workflow/9813244?hl=ko" },
 ] });
 render(<SanctionNoticePanel {...props} isSuspended />);
 await screen.findByText("Apple App Store");
 expect(screen.getByText("Google Play")).toBeInTheDocument();
 expect(screen.getAllByRole("link", { name: "환불 신청 안내" })).toHaveLength(2);
 expect(suspend).not.toHaveBeenCalled();
});

test("원장 미확정 안내는 별도 확인 전 발송을 막는다", async () => {
 const user = userEvent.setup();
 load.mockResolvedValue({ ...preview, kind: "indefinite", noticeStatus: "review_required", reviewReasons: ["원장 불일치"], text: "정지 안내 / 결제 내역 확인 중" });
 render(<SanctionNoticePanel {...props} isSuspended />);
 const button = await screen.findByRole("button", { name: "LMS 안내 발송" });
 expect(button).toBeDisabled();
 await user.click(screen.getByRole("checkbox"));
 await user.click(button);
 await waitFor(() => expect(send).toHaveBeenCalledWith("u1", "s1", expect.objectContaining({ allowReviewRequired: true })));
});

test("대상 교체 뒤 이전 정지 응답이 새 사용자의 안내에 반영되지 않는다", async () => {
 const user = userEvent.setup();
 let resolve!: (data: unknown) => void;
 suspend.mockReturnValue(new Promise(done => { resolve = done; }));
 const changed = jest.fn();
 const { rerender } = render(<SanctionNoticePanel key="kr:u1" {...props} onChanged={changed} />);
 await apply(user);
 rerender(<SanctionNoticePanel key="jp:u2" {...props} userId="u2" country="jp" onChanged={changed} />);
 await act(async () => { resolve({ sanctionId: "old" }); });
 expect(screen.getByRole("region", { name: "제재·환불 안내" })).toHaveTextContent("u2 · JP");
 expect(changed).not.toHaveBeenCalled();
 expect(load).not.toHaveBeenCalled();
 expect(screen.queryByLabelText("서버 안내 문안")).not.toBeInTheDocument();
});

test("접수 응답 timeout 뒤 서버 상태를 재조회하여 중복 발송을 막는다", async () => {
 const user = userEvent.setup();
 load.mockResolvedValueOnce(preview).mockResolvedValueOnce({ ...preview, noticeStatus: "submission_unknown", outboxId: "o1" });
 send.mockRejectedValue(new Error("접수 응답 시간 초과"));
 render(<SanctionNoticePanel {...props} isSuspended />);
 await user.click(await screen.findByRole("button", { name: "LMS 안내 발송" }));
 await screen.findByText(/접수 여부 확인 필요/);
 expect(screen.getByRole("button", { name: "LMS 안내 발송" })).toBeDisabled();
 expect(send).toHaveBeenCalledTimes(1);
 expect(load).toHaveBeenLastCalledWith("u1", "s1");
});


test("원장 미확정 상태는 outbox 없는 상태 조회 이후에도 검토 확인을 요구한다", async () => {
 const user = userEvent.setup();
 load.mockResolvedValue({ ...preview, kind: "indefinite", noticeStatus: "review_required", reviewReasons: ["원장 불일치"] });
 jest.spyOn(api, "getSanctionNoticeStatus").mockResolvedValue({ noticeStatus: "awaiting_notice", outboxId: null, retryAllowed: false });
 render(<SanctionNoticePanel {...props} isSuspended />);
 await user.click(await screen.findByRole("button", { name: "발송 상태 확인" }));
 await waitFor(() => expect(api.getSanctionNoticeStatus).toHaveBeenCalledWith("u1", "s1"));
 expect(screen.getByRole("checkbox")).not.toBeChecked();
 expect(screen.getByRole("button", { name: "LMS 안내 발송" })).toBeDisabled();
 expect(screen.getByText("문자 안내: 원장 검토 필요")).toBeInTheDocument();
});
