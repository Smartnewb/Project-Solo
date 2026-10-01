"use client";
import {
  Alert,
  Button,
  Description,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";

import React, { useState } from "react";

import { RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { blacklist } from "@/app/services/admin";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { formatDateTimeWithoutTimezoneConversion } from "@/app/utils/formatters";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentReason?: string | null;
  blacklistedAt?: string | null;
  onSuccess?: () => void;
}

const RELEASE_REASON_MAX = 500;

export function BlacklistReleaseDialog({
  open,
  onClose,
  userId,
  userName,
  currentReason,
  blacklistedAt,
  onSuccess,
}: Props) {
  const [releaseReason, setReleaseReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const trimmed = releaseReason.trim();
      return blacklist.release(
        userId,
        trimmed ? { releaseReason: trimmed } : undefined,
      );
    },
    onSuccess: () => {
      onSuccess?.();
      resetAndClose();
    },
  });
  const submitting = mutation.isPending;
  const error = mutation.isError
    ? getAdminErrorMessage(mutation.error, "블랙리스트 해제 실패")
    : null;

  const resetAndClose = () => {
    setReleaseReason("");
    mutation.reset();
    onClose();
  };

  const handleClose = () => {
    if (submitting) return;
    resetAndClose();
  };

  const releaseReasonOver = releaseReason.length > RELEASE_REASON_MAX;
  const submitDisabled = submitting || releaseReasonOver;

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
              <RotateCcw size={20} />
              블랙리스트 해제
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div>
              <div className={"text-sm text-neutral-700"}>대상 유저</div>
              <div className={"text-sm text-neutral-700"}>{userName}</div>
            </div>
            {currentReason && (
              <div>
                <div className={"text-sm text-neutral-700"}>등록 사유</div>
                <div
                  style={{ whiteSpace: "pre-wrap" }}
                  className={"text-sm text-neutral-700"}
                >
                  {currentReason}
                </div>
              </div>
            )}
            {blacklistedAt && (
              <div>
                <div className={"text-sm text-neutral-700"}>등록일</div>
                <div className={"text-sm text-neutral-700"}>
                  {formatDateTimeWithoutTimezoneConversion(blacklistedAt)}
                </div>
              </div>
            )}
            <Alert style={{ marginBottom: 8 }} status={"default"} role="alert">
              <Alert.Content>
                해제 시 유저는 재로그인·서비스 이용이 가능합니다. 푸시 재활성은
                앱 재실행 시 복원됩니다.
              </Alert.Content>
            </Alert>
            <TextField
              className="w-full"
              isDisabled={undefined}
              isInvalid={releaseReasonOver}
            >
              <Label>{"해제 사유 (선택)"}</Label>
              <TextArea
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                rows={4}
                aria-label={"해제 사유 (선택)"}
              />
              <Description>{`${releaseReason.length}/${RELEASE_REASON_MAX}`}</Description>
            </TextField>
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
              {<RotateCcw size={16} />}
              {submitting ? "해제 중..." : "블랙리스트 해제"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export default BlacklistReleaseDialog;
