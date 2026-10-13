"use client";
import { Button, Spinner, Chip, Modal, Tabs, TextField, Label, TextArea, Select, ListBox } from '@heroui/react';
import { useState, useEffect, useCallback } from "react";
import AdminService from "@/app/services/admin";
import type { EtaSubmission, EtaSubmissionStatus, EtaSubmissionStatusFilter, } from "@/app/services/admin";
import { useToast } from "@/shared/ui/admin/toast/toast-context";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
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
    "다운로드 링크가 보이지 않음",
    "홍보 게시판이 아닌 곳에 게시",
    "제공된 글과 다른 내용",
    "스크린샷이 홍보 게시글이 아님",
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
    const confirm = useConfirm();
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
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
    const rejectProcessing = !!rejectTarget && processingId === rejectTarget.id;
    const pendingIds = items.filter((s) => s.status === "pending").map((s) => s.id);
    const selectedPendingIds = selectedIds.filter((id) => pendingIds.includes(id));
    const allPendingSelected = pendingIds.length > 0 && selectedPendingIds.length === pendingIds.length;
    const busy = !!processingId || !!bulkProgress;
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await AdminService.etaMission.getSubmissions(status, page + 1, rowsPerPage);
            setItems(res.items);
            setTotal(res.total);
            setSelectedIds([]);
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
    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };
    const toggleAllPending = () => {
        setSelectedIds(allPendingSelected ? [] : pendingIds);
    };
    const handleBulkApprove = async () => {
        if (busy || selectedPendingIds.length === 0)
            return;
        const targets = selectedPendingIds;
        const ok = await confirm({
            title: "선택 승인",
            message: `선택한 ${targets.length}건을 승인합니다.\n건마다 구슬이 지급되고 유저에게 푸시가 발송됩니다.`,
            confirmText: `${targets.length}건 승인`,
        });
        if (!ok)
            return;
        let succeeded = 0;
        let failed = 0;
        setBulkProgress({ done: 0, total: targets.length });
        for (const id of targets) {
            try {
                await AdminService.etaMission.approve(id);
                succeeded += 1;
            }
            catch {
                failed += 1;
            }
            setBulkProgress({ done: succeeded + failed, total: targets.length });
        }
        setBulkProgress(null);
        if (failed === 0)
            toast.success(`${succeeded}건 승인 완료`);
        else
            toast.error(`승인 ${succeeded}건, 실패 ${failed}건 — 실패한 건은 이미 처리됐을 수 있습니다. 목록을 확인해주세요.`);
        await load();
    };
    const handleApprove = async (submission: EtaSubmission) => {
        if (busy)
            return;
        const ok = await confirm({
            title: "인증 승인",
            message: `${submission.name ?? "이름 없음"}(${submission.schoolName})님의 인증을 승인합니다.\n구슬이 지급되고 유저에게 푸시가 발송됩니다.`,
            confirmText: "승인",
        });
        if (!ok)
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBlock: 12 }}>
          <span style={{ color: "#6b7280" }}>
            {bulkProgress
                ? `승인 처리 중 ${bulkProgress.done}/${bulkProgress.total}`
                : selectedPendingIds.length > 0
                    ? `${selectedPendingIds.length}건 선택됨`
                    : "대기 건을 선택하면 한 번에 승인할 수 있습니다."}
          </span>
          <Button variant="primary" isDisabled={busy || selectedPendingIds.length === 0} onPress={handleBulkApprove}>
            {`선택 ${selectedPendingIds.length}건 승인`}
          </Button>
        </div>

        <div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr className="border-b">
                <th scope="col" className="border-b px-4 py-3">
                  <input type="checkbox" aria-label="대기 건 전체 선택" checked={allPendingSelected} disabled={busy || pendingIds.length === 0} onChange={toggleAllPending} />
                </th>
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
                  <td colSpan={9} style={{ paddingBlock: 48 }} className="border-b px-4 py-3">
                    <Spinner size="sm"></Spinner>
                  </td>
                </tr>) : items.length === 0 ? (<tr className="border-b">
                  <td colSpan={9} style={{ paddingBlock: 48, color: "#6b7280" }} className="border-b px-4 py-3">
                    제출 내역이 없습니다.
                  </td>
                </tr>) : (items.map((s) => (<tr key={s.id} className="border-b">
                    <td className="border-b px-4 py-3">
                      {s.status === "pending" ? (<input type="checkbox" aria-label={`${s.name ?? "이름 없음"} 선택`} checked={selectedIds.includes(s.id)} disabled={busy} onChange={() => toggleSelected(s.id)} />) : null}
                    </td>
                    <td className="border-b px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <Button variant="tertiary" isIconOnly className="h-40 w-24 overflow-hidden bg-gray-50 p-0" aria-label="이미지 확대" onPress={() => setLightboxUrl(s.screenshotUrl)}><img src={s.screenshotUrl} alt="에타 스크린샷" className="h-40 w-24 max-w-none rounded-md object-contain" /></Button>
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
                          <Button isDisabled={busy} onPress={() => handleApprove(s)} variant="primary">
                            승인
                          </Button>
                          <Button isDisabled={busy} onPress={() => openRejectModal(s)} variant="secondary">
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
        }}><Modal.Container size="lg"><Modal.Dialog aria-label="에타 스크린샷 확대" style={{ width: '100%', maxWidth: 900, minWidth: 0 }}>
        <Modal.CloseTrigger aria-label="닫기" />
        <Modal.Body style={{ padding: 0 }}>
          {lightboxUrl && (<img src={lightboxUrl} alt="에타 스크린샷 확대" style={{ display: "block", maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain" }}></img>)}
        </Modal.Body>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>

      {/* 거절 사유 모달 */}
      <Modal.Backdrop isOpen={!!rejectTarget} isDismissable={!rejectProcessing} isKeyboardDismissDisabled={rejectProcessing} onOpenChange={next => {
            if (!next && !rejectProcessing)
                (() => setRejectTarget(null))();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
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
          <Button onPress={() => setRejectTarget(null)} isDisabled={rejectProcessing} variant="tertiary">
            취소
          </Button>
          <Button onPress={handleRejectConfirm} isDisabled={!rejectReason.trim() || rejectProcessing} variant="danger">
            거절하기
          </Button>
        </Modal.Footer>
      </Modal.Dialog></Modal.Container></Modal.Backdrop>
    </div>);
}
