"use client";
import { Button as HeroActionButton } from "@heroui/react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Description,
  Label,
  Input,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";

import React, { useEffect, useState } from "react";

import { ShieldBan, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { blacklist } from "@/app/services/admin";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";

const WARNING_ID = "blacklist-register-warning";
const NOTICE_WARNING_ID = "blacklist-notice-warning";

interface Props {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    phoneNumber?: string;
    age?: number;
    gender?: string;
    universityName?: string;
  };
  initialReason?: string;
  initialMemo?: string;
  onSuccess?: (message?: string) => void;
}

const QUICK_REASONS = [
  "욕설/혐오",
  "스팸",
  "사칭",
  "미성년",
  "신고누적",
  "결제어뷰징",
];

const REASON_MAX = 500;
const MEMO_MAX = 2000;

export function BlacklistRegisterModal({
  open,
  onClose,
  user,
  initialReason = "",
  initialMemo = "",
  onSuccess,
}: Props) {
  const [reason, setReason] = useState(initialReason);
  const [memo, setMemo] = useState(initialMemo);
  const [approverId, setApproverId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [sendNotice, setSendNotice] = useState(true);

  useEffect(() => {
    if (!open) return;
    setReason(initialReason);
    setMemo(initialMemo);
    setApproverId('');
    setConfirmed(false);
    setSendNotice(true);
  }, [open, initialReason, initialMemo, user.id]);

  const mutation = useMutation({
    mutationFn: () =>
      blacklist.register(user.id, {
        reason: reason.trim(),
        memo: memo.trim() ? memo.trim() : undefined,
        sendNotice,
        approverId: approverId.trim(),
      }),
    onSuccess: () => {
      const message = sendNotice
        ? "제재 완료. 유저 고지 발송을 요청했습니다."
        : "제재 완료. 운영자 선택으로 고지는 보내지 않았습니다.";
      onSuccess?.(message);
      resetAndClose();
    },
  });
  const submitting = mutation.isPending;
  const error = mutation.isError
    ? getAdminErrorMessage(mutation.error, "블랙리스트 등록 실패")
    : null;

  const resetAndClose = () => {
    setReason(initialReason);
    setMemo(initialMemo);
    setApproverId('');
    setConfirmed(false);
    setSendNotice(true);
    mutation.reset();
    onClose();
  };

  const handleClose = () => {
    if (submitting) return;
    resetAndClose();
  };

  const appendQuickReason = (label: string) => {
    setReason((prev) => {
      if (!prev.trim()) return label;
      if (prev.includes(label)) return prev;
      return `${prev} · ${label}`;
    });
  };

  const reasonOver = reason.length > REASON_MAX;
  const memoOver = memo.length > MEMO_MAX;
  const submitDisabled =
    submitting ||
    !confirmed ||
    approverId.trim().length === 0 ||
    reason.trim().length === 0 ||
    reasonOver ||
    memoOver;

  const handleSubmit = () => {
    if (submitDisabled) return;
    mutation.mutate();
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose?.();
      }}
      isDismissable={handleClose !== undefined}
    >
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
          <Modal.Header
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <Modal.Heading>
              <ShieldBan size={20} />
              블랙리스트 등록
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div>
              <div className={"text-sm text-neutral-700"}>대상 유저</div>
              <div className={"text-sm text-neutral-700"}>
                {user.name}
                {user.age ? ` · ${user.age}세` : ""}
                {user.gender ? ` · ${user.gender}` : ""}
              </div>
              {user.phoneNumber && (
                <div className={"text-sm text-neutral-700"}>
                  {user.phoneNumber}
                </div>
              )}
              {user.universityName && (
                <div className={"text-sm text-neutral-700"}>
                  {user.universityName}
                </div>
              )}
            </div>
            <Alert
              style={{ marginBottom: 8 }}
              status={"warning"}
              role="alert"
              id={NOTICE_WARNING_ID}
            >
              <Alert.Content>
                <div className={"text-sm text-neutral-700"}>
                  유저 고지 발송 안내
                </div>
                <div
                  style={{ marginBottom: 2 }}
                  className={"text-sm text-neutral-700"}
                >
                  기본으로 인앱 알림 + SMS 고지가 발송됩니다.
                </div>
                <div
                  style={{ marginBottom: 2 }}
                  className={"text-sm text-neutral-700"}
                >
                  문구에 정지/이용제한 사유와 7일 이내 소명 안내가 포함됩니다.
                </div>
                <div className={"text-sm text-neutral-700"}>
                  직접 발송 번호/이메일 안내는 백엔드 템플릿 기준입니다.
                </div>
              </Alert.Content>
            </Alert>
            <Alert
              style={{ marginBottom: 8 }}
              status="danger"
              role="alert"
              id={WARNING_ID}
            >
              <Alert.Content>
                <div className={"text-sm text-neutral-700"}>
                  블랙리스트 · 영구 차단 성격 + 기본 고지
                </div>
                <ul style={{ margin: 0, paddingLeft: 10 }}>
                  <li>세션 강제 만료 (현재 로그인 끊김)</li>
                  <li>재로그인 차단 / 매칭 후보 풀 제외</li>
                  <li>영구 차단 성격 (해제 전까지 유지)</li>
                  <li>기본값으로 약관 고지(인앱 알림+SMS) 발송</li>
                </ul>
              </Alert.Content>
            </Alert>
            <div>
              <div className={"text-sm text-neutral-700"}>빠른 사유</div>
              <div className={"flex flex-wrap items-center gap-2"}>
                {QUICK_REASONS.map((label) => (
                  <HeroActionButton
                    key={label}
                    variant="ghost"
                    className="h-auto min-w-0 p-0"
                    onClick={() => appendQuickReason(label)}
                  >
                    <Chip size={"sm"} variant={"soft"}>
                      {label}
                    </Chip>
                  </HeroActionButton>
                ))}
              </div>
            </div>
            <TextField
              className="w-full"
              isDisabled={undefined}
              isInvalid={reasonOver}
            >
              <Label>{"사유 (필수)"}</Label>
              <TextArea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                aria-label={"사유 (필수)"}
              />
              <Description>{`${reason.length}/${REASON_MAX}`}</Description>
            </TextField>
            <TextField
              className="w-full"
              isDisabled={undefined}
              isInvalid={memoOver}
            >
              <Label>{"메모 (선택)"}</Label>
              <TextArea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                aria-label={"메모 (선택)"}
              />
              <Description>{`${memo.length}/${MEMO_MAX}`}</Description>
            </TextField>
            <TextField isRequired isInvalid={approverId.trim().length === 0}>
              <Label>승인자 관리자 ID (2인 승인, 필수)</Label>
              <Input value={approverId} onChange={e => setApproverId(e.target.value)} placeholder="본인이 아닌 다른 관리자의 user id" />
              <Description>영구 차단은 집행자 외 다른 관리자의 승인이 필요합니다. 승인자의 users.id 를 입력하세요.</Description>
            </TextField>
            <div className="flex items-center gap-2">
              <Checkbox
                isSelected={sendNotice}
                isDisabled={submitting}
                isIndeterminate={undefined}
                onChange={(isSelected) => setSendNotice(isSelected)}
                style={{ paddingTop: 1 }}
                aria-describedby={NOTICE_WARNING_ID}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Label>{"유저에게 고지(알림+문자) 보내기"}</Label>
                </Checkbox.Content>
              </Checkbox>
            </div>
            {!sendNotice && (
              <Alert style={{ marginTop: 4 }} status="danger" role="alert">
                <Alert.Content>
                  고지 없이 제재합니다. 약관 고지 누락 위험이 있으니 특별한
                  경우에만 사용하세요.
                </Alert.Content>
              </Alert>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                isSelected={confirmed}
                isDisabled={undefined}
                isIndeterminate={undefined}
                onChange={(isSelected) => setConfirmed(isSelected)}
                aria-describedby={WARNING_ID}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Label>
                    {"이 유저를 블랙리스트 등록합니다. 확인했습니다."}
                  </Label>
                </Checkbox.Content>
              </Checkbox>
            </div>
            {error && (
              <Alert style={{ marginTop: 8 }} status="danger" role="alert">
                <Alert.Content>{error}</Alert.Content>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={handleClose}
              variant={"ghost"}
              isDisabled={submitting}
              size={"md"}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              variant={"primary"}
              isDisabled={submitDisabled}
              size={"md"}
              className="rounded-xl"
            >
              {<ShieldBan size={16} />}
              {submitting ? "등록 중..." : "블랙리스트 등록"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export default BlacklistRegisterModal;
