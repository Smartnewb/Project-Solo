"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import AdminService from "@/app/services/admin";
import type { SanctionNoticePreview, SanctionNoticeStatus } from "@/app/services/admin/users";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";

const statuses: Record<SanctionNoticeStatus, string> = {
  awaiting_notice: "고지 대기", queued: "발송 대기", submitted: "공급자 접수 완료",
  delivered: "배달 완료 (수신 확인 아님)", failed: "발송 실패",
  submission_unknown: "접수 여부 확인 필요 — 중복 발송 금지", review_required: "원장 검토 필요",
};

interface Props {
  userId: string;
  userName?: string;
  country: "kr" | "jp";
  isSuspended: boolean;
  onBusyChange?: (busy: boolean) => void;
  onChanged?: (message: string) => void | Promise<void>;
  onLater?: () => void;
}

export default function SanctionNoticePanel({ userId, userName, country, isSuspended, onBusyChange, onChanged, onLater }: Props) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState("7");
  const [allowReviewRequired, setAllowReviewRequired] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [suspended, setSuspended] = useState(isSuspended);
  const [preview, setPreview] = useState<SanctionNoticePreview | null>(null);
  const [sanctionId, setSanctionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const active = useRef(true);
  const running = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  const loadPreview = async (id?: string) => {
    const data = await AdminService.userAppearance.getSanctionNoticePreview(userId, id);
    if (active.current) { setPreview(data); setSanctionId(data.sanctionId); setAllowReviewRequired(false); }
  };
  useEffect(() => {
    if (!isSuspended) return;
    let cancelled = false;
    AdminService.userAppearance.getSanctionNoticePreview(userId).then((data) => {
      if (!cancelled && active.current) { setPreview(data); setSanctionId(data.sanctionId); setAllowReviewRequired(false); }
    }).catch((err) => {
      if (!cancelled && active.current) setError(getAdminErrorMessage(err, "기존 제재 안내를 조회하지 못했습니다. 정지는 유지됩니다."));
    });
    return () => { cancelled = true; };
  }, [userId, country, isSuspended]);

  const run = async (action: () => Promise<void>) => {
    if (running.current) return;
    running.current = true; setBusy(true); setError(null); onBusyChange?.(true);
    try { await action(); }
    catch (err) { if (active.current) setError(getAdminErrorMessage(err, "요청을 처리하지 못했습니다.")); }
    finally {
      running.current = false;
      if (active.current) { setBusy(false); onBusyChange?.(false); }
    }
  };
  const refresh = async (message: string) => {
    try { await onChanged?.(message); }
    catch { if (active.current) setError(`${message} 화면 갱신에 실패했습니다. 정지를 다시 적용하지 마세요.`); }
  };
  const suspend = () => run(async () => {
    const data = await AdminService.userAppearance.suspendUser(userId, {
      reason: reason.trim(), note: note.trim(), noticeMode: "prepare",
      ...(duration === "indefinite" ? { permanent: true } : { durationDays: Number(duration) as 3 | 7 | 14 | 30 }),
    });
    if (!active.current) return;
    setSuspended(true); setConfirming(false); setResult("정지 완료. 안내는 아직 발송하지 않았습니다.");
    const id = data?.sanctionId;
    setSanctionId(id ?? null);
    await refresh("계정 정지가 완료되었습니다.");
    if (data?.noticeError) { setError(`정지 완료. ${data.noticeError} 안내 기록을 확인해 주세요.`); return; }
    try { await loadPreview(id ?? undefined); }
    catch (err) { if (active.current) setError(`정지 완료. ${getAdminErrorMessage(err, "안내 조회 실패")} 안내만 다시 조회해 주세요.`); }
  });
  const send = () => run(async () => {
    if (!preview) return;
    try {
      const state = await AdminService.userAppearance.sendSanctionNotice(userId, preview.sanctionId, {
        snapshotHash: preview.snapshotHash, templateVersion: preview.templateVersion,
        ...(allowReviewRequired ? { allowReviewRequired: true } : {}),
      });
      if (active.current) setPreview({ ...preview, ...state });
    } catch (err) {
      // A timeout can follow supplier acceptance. Invalidate the send button until server readback.
      if (active.current) setPreview(null);
      try { await loadPreview(preview.sanctionId); } catch { /* Explicit requery remains available. */ }
      throw err;
    }
  });
  const release = () => run(async () => {
    await AdminService.userAppearance.unsuspendUser(userId);
    if (!active.current) return;
    setSuspended(false); setPreview(null); setSanctionId(null); setResult("계정 정지가 해제되었습니다.");
    await refresh("계정 정지가 해제되었습니다.");
  });
  const date = (value: string | null) => value ? new Date(value).toLocaleString(country === "jp" ? "ja-JP" : "ko-KR", { timeZone: country === "jp" ? "Asia/Tokyo" : "Asia/Seoul" }) : "무기한";

  return <section className="space-y-4 min-w-0" aria-label="제재·환불 안내">
    <p className="text-sm break-all">대상: <strong>{userName || userId}</strong> · {userId} · {country.toUpperCase()}</p>
    <p role="status">현재 상태: {suspended ? "정지" : "정상"}{preview ? ` · ${date(preview.suspendedUntil)}` : ""}</p>
    {result && <p role="status" className="text-green-700">{result}</p>}
    {error && <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</div>}
    {!suspended ? <>
      <fieldset disabled={busy || confirming} className="space-y-3">
        <label className="block">회원 공개 정지 사유 (필수)<textarea aria-label="회원 공개 정지 사유" className="block w-full border rounded p-2" value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={500} /></label>
        <label className="block">내부 메모 (문자에 포함되지 않음)<textarea aria-label="내부 메모" className="block w-full border rounded p-2" value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={1000} /></label>
        <label className="block">정지 기간<select aria-label="정지 기간" className="ml-2 border rounded p-2" value={duration} onChange={e => setDuration(e.target.value)}>{[3, 7, 14, 30].map(d => <option key={d} value={d}>{d}일</option>)}<option value="indefinite">무기한</option></select></label>
      </fieldset>
      {confirming ? <div className="border rounded p-3 space-y-3"><p>{userName || userId}님을 {duration === "indefinite" ? "무기한" : `${duration}일`} 정지합니다. 문자 발송은 문안 확인 후 별도로 진행합니다.</p><Button isDisabled={busy} onPress={suspend}>확인 후 정지 적용</Button><Button variant="secondary" isDisabled={busy} onPress={() => setConfirming(false)}>취소</Button></div>
        : <Button isDisabled={busy || !reason.trim()} onPress={() => setConfirming(true)}>정지 적용</Button>}
    </> : <>
      <Button variant="secondary" isDisabled={busy} onPress={() => run(() => loadPreview(sanctionId ?? undefined))}>안내 다시 조회</Button>
      {preview && <>
        {preview.kind === "indefinite" && <div className="space-y-3" aria-label="환불 원장">
          {preview.balanceSummary && <p>잔여 {preview.balanceSummary.balance}개 · 유료 {preview.balanceSummary.paid}개 · 무상 {preview.balanceSummary.free}개 · 확인 필요 {preview.balanceSummary.unknown}개</p>}
          <div className="grid gap-3 sm:grid-cols-2">{preview.paymentGroups.map(group => <article key={group.paymentId} className="rounded border p-3 text-sm break-words"><strong>{group.platform === "APPLE" ? "Apple App Store" : group.platform === "GOOGLE" ? "Google Play" : "직접 결제"}</strong><p>구매: {group.paidAt ? date(group.paidAt) : "확인 필요"}</p><p>결제 {group.paymentAmount.toLocaleString()} {group.currency} · 구매 {group.quantity}개 · 잔여 {group.remainingQuantity}개</p><p>환급 참고액 {group.referenceAmount.toLocaleString()} {group.currency} (승인액 아님)</p>{group.refundUrl && <a className="text-blue-700 underline" href={group.refundUrl} target="_blank" rel="noopener noreferrer">환불 신청 안내</a>}</article>)}</div>
        </div>}
        {preview.reviewReasons.length > 0 && <div role="alert" className="bg-amber-50 rounded p-3">원장 검토 필요: {preview.reviewReasons.join(" / ")}</div>}
        {preview.noticeStatus === "review_required" && <label className="block text-sm"><input type="checkbox" checked={allowReviewRequired} disabled={busy} onChange={e => setAllowReviewRequired(e.target.checked)} /> 원장 미확정 상태를 확인했습니다. 금액을 확정하지 않은 서버 안내만 발송합니다.</label>}
        <p role="status">문자 안내: {statuses[preview.noticeStatus]}</p>
        <p>수신 번호: {preview.maskedPhone || "수신 번호 없음 — 연락처 확인 필요"}</p>
        <label className="block">서버 안내 문안<textarea aria-label="서버 안내 문안" readOnly value={preview.text} rows={12} className="block w-full border rounded p-3 text-sm" /></label>
        <p className="text-sm text-gray-600">이 기능은 안내만 발송하며 금전 환불을 실행하지 않습니다.</p>
        <div className="flex flex-wrap gap-2">
          <Button isDisabled={busy || !preview.maskedPhone || !(preview.noticeStatus === "awaiting_notice" || (preview.noticeStatus === "review_required" && allowReviewRequired))} onPress={send}>LMS 안내 발송</Button>
          <Button variant="secondary" isDisabled={busy} onPress={() => run(async () => {
            const state = await AdminService.userAppearance.getSanctionNoticeStatus(userId, preview.sanctionId);
            if (active.current) setPreview({ ...preview, ...state,
              noticeStatus: state.noticeStatus === "awaiting_notice" && preview.reviewReasons.length > 0 ? "review_required" : state.noticeStatus,
            });
          })}>발송 상태 확인</Button>
          {onLater && <Button variant="secondary" isDisabled={busy} onPress={onLater}>안내 나중에</Button>}
        </div>
      </>}
      <details><summary>정지 해제</summary><p>해제하면 다시 로그인·이용할 수 있으며 기존 안내 초안은 사용할 수 없습니다.</p><Button variant="danger" isDisabled={busy} onPress={release}>정지 해제 적용</Button></details>
    </>}
    {busy && <p role="status">처리 중입니다. 완료 후 닫을 수 있습니다.</p>}
  </section>;
}
