"use client";
import { Button, Spinner, Chip, Modal, Tabs, TextField, Label, TextArea, Select, ListBox } from '@heroui/react';
import { useState, useEffect, useCallback } from "react";
import AdminService from "@/app/services/admin";
import type { EtaSubmission, EtaSubmissionStatus, EtaSubmissionStatusFilter, } from "@/app/services/admin";
import { useToast } from "@/shared/ui/admin/toast/toast-context";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { safeToLocaleDateString } from "@/app/utils/formatters";
import { sanitizeUrl } from "@/shared/lib/safe-url";
const STATUS_TABS: {
    value: EtaSubmissionStatusFilter;
    label: string;
}[] = [
    { value: "pending", label: "대기" },
    { value: "approved", label: "승인" },
    { value: "rejected", label: "거절" },
    { value: "all", label: "전체" },
];
// solo-nestjs-api src/everytime-promo/constants/reject-reasons.ts 와 동기화 유지 (별도 레포).
const QUICK_REASONS = [
    "스크린샷이 홍보 게시글이 아님",
    "홍보 문구/이미지 누락",
    "비공개 또는 삭제된 게시글",
    "중복/도용 스크린샷",
    "해당 학교 에브리타임이 아님",
    "식별 불가 (캡처 불량)",
];
const STATUS_CHIP: Record<EtaSubmissionStatus, {
    label: string;
    color: "warning" | "success" | "error";
}> = {
    pending: { label: "대기", color: "warning" },
    approved: { label: "승인", color: "success" },
    rejected: { label: "거절", color: "error" },
};
export default function EtaMissionReviewPage() {
    const toast = useToast();
    const [status, setStatus] = useState<EtaSubmissionStatusFilter>("pending");
    const [page, setPage] = useState(0); // 화면 페이지는 0-based, API는 1-based
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [items, setItems] = useState<EtaSubmission[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [rejectTarget, setRejectTarget] = useState<EtaSubmission | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await AdminService.etaMission.getSubmissions(status, page + 1, rowsPerPage);
            setItems(res.items);
            setTotal(res.total);
        }
        catch (error) {
            toast.error(getAdminErrorMessage(error, "목록을 불러오지 못했습니다."));
        }
        finally {
            setLoading(false);
        }
        // toast는 deps에서 제외 — Provider value가 매 렌더 새 객체라 포함 시 load 재생성→useEffect 무한 루프.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, page, rowsPerPage]);
    useEffect(() => {
        load();
    }, [load]);
    const handleTabChange = (_e: React.SyntheticEvent, value: EtaSubmissionStatusFilter) => {
        setStatus(value);
        setPage(0);
    };
    const handleApprove = async (submission: EtaSubmission) => {
        if (processingId)
            return;
        setProcessingId(submission.id);
        try {
            const res = await AdminService.etaMission.approve(submission.id);
            toast.success(`승인 완료 — 구슬 ${res.gemsAwarded}개 지급`);
            await load();
        }
        catch (error) {
            toast.error(getAdminErrorMessage(error, "승인에 실패했습니다."));
        }
        finally {
            setProcessingId(null);
        }
    };
    const openRejectModal = (submission: EtaSubmission) => {
        setRejectTarget(submission);
        setRejectReason("");
    };
    const handleRejectConfirm = async () => {
        if (!rejectTarget)
            return;
        const reason = rejectReason.trim();
        if (!reason) {
            toast.error("거절 사유를 입력해주세요.");
            return;
        }
        setProcessingId(rejectTarget.id);
        try {
            await AdminService.etaMission.reject(rejectTarget.id, reason);
            toast.success("거절 처리 완료 — 유저에게 사유가 전달됩니다.");
            setRejectTarget(null);
            setRejectReason("");
            await load();
        }
        catch (error) {
            toast.error(getAdminErrorMessage(error, "거절에 실패했습니다."));
        }
        finally {
            setProcessingId(null);
        }
    };
    return (<div style={{ padding: 24 }}>
      <h1 className="text-2xl font-bold" style={{ marginBottom: 4 }}>
        에타 미션 인증 심사
      </h1>
      <p style={{ marginBottom: 16 }}>
        에브리타임 홍보 미션 인증 제출을 검토하고 승인/거절합니다. 승인 시 구슬 지급 + 유저 푸시, 거절 시 사유 푸시.
      </p>

      <section className="rounded-xl border bg-white p-4">
        <Tabs selectedKey={status} onSelectionChange={key => handleTabChange({} as never, key as never)}><Tabs.List aria-label="관리 항목">
          {STATUS_TABS.map((t) => (<Tabs.Tab key={t.value} id={t.value}>{t.label}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>))}
        </Tabs.List></Tabs>

        <div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="border-b">
                <th scope="col" className="border-b px-4 py-3">스크린샷</th>
                <th scope="col" className="border-b px-4 py-3">이름</th>
                <th scope="col" className="border-b px-4 py-3">학교</th>
                <th scope="col" className="border-b px-4 py-3">게시글</th>
                <th scope="col" className="border-b px-4 py-3">제출일</th>
                <th scope="col" className="border-b px-4 py-3">상태</th>
                <th scope="col" className="border-b px-4 py-3">거절 사유</th>
                <th scope="col" className="border-b px-4 py-3">처리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr className="border-b">
                  <td colSpan={8} style={{ paddingBlock: 48 }} className="border-b px-4 py-3">
                    <Spinner size="sm"></Spinner>
                  </td>
                </tr>) : items.length === 0 ? (<tr className="border-b">
                  <td colSpan={8} style={{ paddingBlock: 48, color: "#6b7280" }} className="border-b px-4 py-3">
                    제출 내역이 없습니다.
                  </td>
                </tr>) : (items.map((s) => (<tr key={s.id} className="border-b">
                    <td className="border-b px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Button variant="tertiary" aria-label="이미지 확대" onPress={() => setLightboxUrl(s.screenshotUrl)}><img src={s.screenshotUrl} alt="에타 스크린샷" width={56} height={56} style={{ objectFit: "cover", borderRadius: 6 }} /></Button>
                    </td>
                    <td className="border-b px-4 py-3">{s.name ?? "-"}</td>
                    <td className="border-b px-4 py-3">{s.schoolName}</td>
                    <td className="border-b px-4 py-3">
                      {s.postUrl && sanitizeUrl(s.postUrl) ? (<a href={sanitizeUrl(s.postUrl) ?? undefined} target="_blank" rel="noopener noreferrer">
                          링크
                        </a>) : ("-")}
                    </td>
                    <td className="border-b px-4 py-3">{safeToLocaleDateString(s.submittedAt)}</td>
                    <td className="border-b px-4 py-3">
                      <Chip size="sm">{STATUS_CHIP[s.status].label}</Chip>
                    </td>
                    <td style={{ maxWidth: 200, whiteSpace: "pre-wrap" }} className="border-b px-4 py-3">
                      {s.rejectionReason ?? "-"}
                    </td>
                    <td className="border-b px-4 py-3">
                      {s.status === "pending" ? (<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <Button isDisabled={processingId === s.id} onPress={() => handleApprove(s)} variant="primary">
                            승인
                          </Button>
                          <Button isDisabled={processingId === s.id} onPress={() => openRejectModal(s)} variant="secondary">
                            거절
                          </Button>
                        </div>) : (<p>
                          처리 완료
                        </p>)}
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 border-t p-4"><div><Select aria-label="페이지당 행 수" value={rowsPerPage} onChange={(key) => {
            const value = String(key ?? "");
            setRowsPerPage(parseInt(value, 10));
            setPage(0);
        }} className="min-w-[120px]"><Label>페이지당 행 수</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={10} textValue={"10"}>10</ListBox.Item><ListBox.Item id={20} textValue={"20"}>20</ListBox.Item><ListBox.Item id={50} textValue={"50"}>50</ListBox.Item><ListBox.Item id={100} textValue={"100"}>100</ListBox.Item></ListBox></Select.Popover></Select></div><Button variant="secondary" isDisabled={page <= 0} onPress={() => ((_e, p) => setPage(p))(null, page - 1)}>이전</Button><span>{page + 1} 페이지 / {total}개</span><Button variant="secondary" isDisabled={(page + 1) * rowsPerPage >= total} onPress={() => ((_e, p) => setPage(p))(null, page + 1)}>다음</Button></div>
      </section>

      {/* 스크린샷 라이트박스 */}
      <Modal.Backdrop isOpen={!!lightboxUrl} onOpenChange={next => {
            if (!next)
                (() => setLightboxUrl(null))();
        }}><Modal.Container size="lg"><Modal.Dialog>
        <Modal.Body style={{ padding: 0 }}>
          {lightboxUrl && (<img src={lightboxUrl} alt="에타 스크린샷 확대" style={{ display: "block", maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain" }}></img>)}
        </Modal.Body>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>

      {/* 거절 사유 모달 */}
      <Modal.Backdrop isOpen={!!rejectTarget} onOpenChange={next => {
            if (!next)
                (() => setRejectTarget(null))();
        }}><Modal.Container size="lg"><Modal.Dialog>
        <Modal.Header><Modal.Heading>
            거절 사유
          </Modal.Heading>
          <p style={{ marginTop: 4 }}>
            유저에게 푸시로 전달됩니다. {rejectTarget?.name ?? ""} · {rejectTarget?.schoolName ?? ""}
          </p>
        </Modal.Header>
        <Modal.Body>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {QUICK_REASONS.map((r) => (<Button key={r} aria-pressed={rejectReason === r} variant={rejectReason === r ? "primary" : "secondary"} onPress={() => setRejectReason(r)}>{r}</Button>))}
          </div>
          <TextField className="mb-4"><Label>{"거절 사유 (직접 입력 가능)"}</Label><TextArea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="사유를 선택하거나 직접 입력하세요"></TextArea></TextField>
        </Modal.Body>
        <Modal.Footer style={{ paddingInline: 24, paddingBottom: 16 }}>
          <Button onPress={() => setRejectTarget(null)} variant="tertiary">
            취소
          </Button>
          <Button onPress={handleRejectConfirm} isDisabled={!rejectReason.trim() || processingId === rejectTarget?.id} variant="primary">
            거절하기
          </Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </div>);
}
