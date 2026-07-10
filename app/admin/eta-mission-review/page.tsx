"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import AdminService from "@/app/services/admin";
import type {
  EtaSubmission,
  EtaSubmissionStatus,
  EtaSubmissionStatusFilter,
} from "@/app/services/admin";
import { useToast } from "@/shared/ui/admin/toast/toast-context";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { safeToLocaleDateString } from "@/app/utils/formatters";

const STATUS_TABS: { value: EtaSubmissionStatusFilter; label: string }[] = [
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

const STATUS_CHIP: Record<EtaSubmissionStatus, { label: string; color: "warning" | "success" | "error" }> = {
  pending: { label: "대기", color: "warning" },
  approved: { label: "승인", color: "success" },
  rejected: { label: "거절", color: "error" },
};

export default function EtaMissionReviewPage() {
  const toast = useToast();

  const [status, setStatus] = useState<EtaSubmissionStatusFilter>("pending");
  const [page, setPage] = useState(0); // MUI는 0-based
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
    } catch (error) {
      toast.error(getAdminErrorMessage(error, "목록을 불러오지 못했습니다."));
    } finally {
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
    if (processingId) return;
    setProcessingId(submission.id);
    try {
      const res = await AdminService.etaMission.approve(submission.id);
      toast.success(`승인 완료 — 구슬 ${res.gemsAwarded}개 지급`);
      await load();
    } catch (error) {
      toast.error(getAdminErrorMessage(error, "승인에 실패했습니다."));
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (submission: EtaSubmission) => {
    setRejectTarget(submission);
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
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
    } catch (error) {
      toast.error(getAdminErrorMessage(error, "거절에 실패했습니다."));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
        에타 미션 인증 심사
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        에브리타임 홍보 미션 인증 제출을 검토하고 승인/거절합니다. 승인 시 구슬 지급 + 유저 푸시, 거절 시 사유 푸시.
      </Typography>

      <Paper>
        <Tabs value={status} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: "divider" }}>
          {STATUS_TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} />
          ))}
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>스크린샷</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>학교</TableCell>
                <TableCell>게시글</TableCell>
                <TableCell>제출일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>거절 사유</TableCell>
                <TableCell align="right">처리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    제출 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.screenshotUrl}
                        alt="에타 스크린샷"
                        width={56}
                        height={56}
                        style={{ objectFit: "cover", borderRadius: 6, cursor: "pointer" }}
                        onClick={() => setLightboxUrl(s.screenshotUrl)}
                      />
                    </TableCell>
                    <TableCell>{s.name ?? "-"}</TableCell>
                    <TableCell>{s.schoolName}</TableCell>
                    <TableCell>
                      {s.postUrl ? (
                        <MuiLink href={s.postUrl} target="_blank" rel="noopener noreferrer">
                          링크
                        </MuiLink>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{safeToLocaleDateString(s.submittedAt)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={STATUS_CHIP[s.status].label} color={STATUS_CHIP[s.status].color} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: "pre-wrap" }}>
                      {s.rejectionReason ?? "-"}
                    </TableCell>
                    <TableCell align="right">
                      {s.status === "pending" ? (
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={processingId === s.id}
                            onClick={() => handleApprove(s)}
                          >
                            승인
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={processingId === s.id}
                            onClick={() => openRejectModal(s)}
                          >
                            거절
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          처리 완료
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="페이지당"
        />
      </Paper>

      {/* 스크린샷 라이트박스 */}
      <Dialog open={!!lightboxUrl} onClose={() => setLightboxUrl(null)} maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          {lightboxUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxUrl}
              alt="에타 스크린샷 확대"
              style={{ display: "block", maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain" }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 거절 사유 모달 */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            거절 사유
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            유저에게 푸시로 전달됩니다. {rejectTarget?.name ?? ""} · {rejectTarget?.schoolName ?? ""}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {QUICK_REASONS.map((r) => (
              <Chip
                key={r}
                label={r}
                onClick={() => setRejectReason(r)}
                color={rejectReason === r ? "primary" : "default"}
                variant={rejectReason === r ? "filled" : "outlined"}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="거절 사유 (직접 입력 가능)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="사유를 선택하거나 직접 입력하세요"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectTarget(null)} color="inherit">
            취소
          </Button>
          <Button
            onClick={handleRejectConfirm}
            variant="contained"
            color="error"
            disabled={!rejectReason.trim() || processingId === rejectTarget?.id}
          >
            거절하기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
