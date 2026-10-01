"use client";
import { Alert, Button, Input, Label, TextField } from "@heroui/react";

import { useEffect, useRef, useState } from "react";

import {
  referrals,
  type ReferralMode,
  type ReferralPreview,
} from "@/app/services/admin/referrals";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";

type Props = { userId: string; createdAt?: string; onCompleted?: () => void };

export function ReferralPostSignupSection({
  userId,
  createdAt,
  onCompleted,
}: Props) {
  const confirm = useConfirm();
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<ReferralPreview | null>(null);
  const [previewedCode, setPreviewedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const executionToken = useRef<symbol | null>(null);

  useEffect(() => {
    requestVersion.current += 1;
    setCode("");
    setReason("");
    setPreview(null);
    setPreviewedCode(null);
    setLoading(false);
    setError(null);
    setKey(null);
    executionToken.current = null;
  }, [userId]);

  const lookup = async () => {
    const version = ++requestVersion.current;
    const lookupCode = code.trim().toUpperCase();
    try {
      setLoading(true);
      setError(null);
      const result = await referrals.preview(userId, lookupCode);
      if (version === requestVersion.current) {
        setPreview(result);
        setPreviewedCode(lookupCode);
      }
    } catch (err) {
      if (version === requestVersion.current) {
        setPreview(null);
        setPreviewedCode(null);
        setError(getAdminErrorMessage(err, "추천 관계를 확인하지 못했습니다."));
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  const execute = async (mode: ReferralMode) => {
    if (!previewedCode) {
      setError("초대코드를 다시 조회해 주세요.");
      return;
    }
    if (mode === "MANUAL_COMPENSATED" && !reason.trim()) {
      setError("수동 보상 처리 사유를 입력해 주세요.");
      return;
    }
    if (executionToken.current) return;
    const token = Symbol("referral-execution");
    executionToken.current = token;
    if (
      !(await confirm({
        message:
          mode === "STANDARD"
            ? "추천 관계를 연결하고 양측 보상을 지급할까요?"
            : "기존 수동 보상으로 관계만 연결할까요?",
      }))
    ) {
      if (executionToken.current === token) executionToken.current = null;
      return;
    }
    const version = requestVersion.current;
    try {
      setLoading(true);
      setError(null);
      const idempotencyKey = key ?? crypto.randomUUID();
      setKey(idempotencyKey);
      const result = await referrals.connect(
        userId,
        {
          referralCode: previewedCode,
          mode,
          reason: reason.trim() || undefined,
        },
        idempotencyKey,
      );
      if (version === requestVersion.current) {
        setPreview(result);
        onCompleted?.();
      }
    } catch (err) {
      if (version === requestVersion.current) {
        setError(getAdminErrorMessage(err, "추천 관계 연결에 실패했습니다."));
      }
    } finally {
      if (executionToken.current === token) executionToken.current = null;
      if (version === requestVersion.current) setLoading(false);
    }
  };

  return (
    <section style={{ padding: 8, marginTop: 8 }}>
      <div className={"text-sm text-neutral-700"}>가입 후 초대코드 연결</div>
      <div className={"text-sm text-neutral-700"}>
        가입일: {createdAt ?? "-"}. 서버가 7일·실사용자·중복 보상 정책을 최종
        검증합니다.
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <TextField
          className="w-full"
          isDisabled={undefined}
          isInvalid={undefined}
        >
          <Label>{"초대코드"}</Label>
          <Input
            value={code}
            onChange={(event) => {
              requestVersion.current += 1;
              executionToken.current = null;
              setCode(event.target.value);
              setReason("");
              setPreview(null);
              setPreviewedCode(null);
              setError(null);
              setKey(null);
              setLoading(false);
            }}
            aria-label={"초대코드"}
          />
        </TextField>
        <Button
          onClick={lookup}
          variant={"ghost"}
          isDisabled={loading || !code.trim()}
          size={"md"}
          className="rounded-xl"
        >
          조회
        </Button>
      </div>
      {error && (
        <Alert style={{ marginTop: 4 }} status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      {preview && (
        <div style={{ marginTop: 4 }}>
          <div className={"text-sm text-neutral-700"}>
            상태: {preview.state}
            {preview.reason ? ` (${preview.reason})` : ""}
          </div>
          <div className={"text-sm text-neutral-700"}>
            초대한 사람:{" "}
            {preview.inviter
              ? `${preview.inviter.name} · ${preview.inviter.phoneSuffix}`
              : "없음"}
          </div>
          {preview.invitation && (
            <div className={"text-sm text-neutral-700"}>
              초대 ID: {preview.invitation.id}· 보상:{" "}
              {preview.invitation.rewardMode}/{preview.invitation.rewardStatus}
            </div>
          )}
          {preview.allowedActions.includes("MANUAL_COMPENSATED") && (
            <TextField
              className="w-full"
              isDisabled={undefined}
              isInvalid={undefined}
            >
              <Label>{"수동 보상 처리 사유"}</Label>
              <Input
                style={{ marginTop: 4 }}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-label={"수동 보상 처리 사유"}
              />
            </TextField>
          )}
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {preview.allowedActions.includes("STANDARD") && (
              <Button
                onClick={() => execute("STANDARD")}
                variant={"primary"}
                isDisabled={loading}
                size={"md"}
                className="rounded-xl"
              >
                연결 및 보상
              </Button>
            )}
            {preview.allowedActions.includes("MANUAL_COMPENSATED") && (
              <Button
                onClick={() => execute("MANUAL_COMPENSATED")}
                variant={"secondary"}
                isDisabled={loading}
                size={"md"}
                className="rounded-xl"
              >
                관계만 연결
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
