import { Alert, Button, Checkbox, Input, Label, Modal, Separator, TextField } from "@heroui/react";
import { Briefcase } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useUpdateUserLifeStage } from "@/app/admin/hooks/use-users";

export const LIFE_STAGE_OPTIONS = [
  { value: "UNDERGRAD", label: "대학생" },
  { value: "GRAD_STUDENT", label: "대학원생" },
  { value: "GRADUATE", label: "졸업생 (취업 준비 중)" },
  { value: "WORKER", label: "직장인" },
  { value: "INTERN", label: "인턴" },
] as const;

// 직장인 요금(2026-10-31): 이 세 단계의 남성은 기능마다 구슬을 더 낸다.
const WORKER_TIER = new Set(["WORKER", "INTERN", "GRAD_STUDENT"]);

export function describePriceEffect(current?: string | null, next?: string | null) {
  if (!next || next === current) return null;
  const before = WORKER_TIER.has(current ?? "");
  const after = WORKER_TIER.has(next);
  if (!before && after) return "직장인 요금이 적용돼 구슬 사용량이 늘어납니다(남성).";
  if (before && !after) return "직장인 요금이 풀려 대학생 요금으로 내려갑니다.";
  return null;
}

interface LifeStageEditModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  currentLifeStage?: string | null;
  onSuccess?: (result: { lifeStage: string }) => void;
}

export default function LifeStageEditModal({
  open,
  onClose,
  userId,
  userName,
  currentLifeStage,
  onSuccess,
}: LifeStageEditModalProps) {
  const [lifeStage, setLifeStage] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useUpdateUserLifeStage();
  const saving = mutation.isPending;

  useEffect(() => {
    setLifeStage(open ? (currentLifeStage ?? "") : "");
    setReason("");
    setConfirmed(false);
    setError(null);
  }, [open, currentLifeStage]);

  const isSame = lifeStage === (currentLifeStage ?? "");
  const priceEffect = describePriceEffect(currentLifeStage, lifeStage);
  const canSave = Boolean(lifeStage && !isSame && reason.trim() && confirmed);
  const currentLabel =
    LIFE_STAGE_OPTIONS.find((option) => option.value === currentLifeStage)?.label ?? "미입력";

  const handleSubmit = async () => {
    if (!canSave) return;
    try {
      setError(null);
      const result = await mutation.mutateAsync({ userId, lifeStage, reason: reason.trim() });
      onSuccess?.({ lifeStage: result.lifeStage });
      onClose();
    } catch (err: any) {
      setError(err.message || "생활 단계 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) (saving ? undefined : onClose)?.();
      }}
      isDismissable={!saving}
      isKeyboardDismissDisabled={saving}
    >
      <Modal.Container size="md" scroll="inside" className="w-full">
        <Modal.Dialog style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}>
          <Modal.Header>
            <Modal.Heading>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Briefcase />
                생활 단계 변경
              </div>
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
            <div style={{ paddingTop: 4 }}>
              {error && (
                <Alert style={{ marginBottom: 8 }} status="danger" role="alert">
                  <Alert.Content>{error}</Alert.Content>
                </Alert>
              )}
              <div style={{ marginBottom: 8 }} className={"text-sm text-neutral-700"}>
                변경 대상: {userName || userId}
              </div>
              <div
                style={{ padding: 8, backgroundColor: "#fafafa", borderRadius: 6, marginBottom: 8 }}
                className={"text-sm text-neutral-700"}
              >
                현재 생활 단계: {currentLabel}
              </div>
              <Separator style={{ marginBottom: 8 }}></Separator>
              <label className={"text-sm text-neutral-700"} htmlFor="life-stage-select">
                변경할 생활 단계
              </label>
              <select
                id="life-stage-select"
                aria-label="변경할 생활 단계"
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
                value={lifeStage}
                disabled={saving}
                onChange={(event) => {
                  setLifeStage(event.target.value);
                  setConfirmed(false);
                }}
              >
                <option value="" disabled>
                  선택하세요
                </option>
                {LIFE_STAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <TextField className="w-full" isDisabled={saving} style={{ marginTop: 8 }}>
                <Label>{"변경 사유 (필수)"}</Label>
                <Input
                  value={reason}
                  maxLength={300}
                  placeholder="예: 고객센터 문의 - 재학증명서 확인"
                  onChange={(event) => setReason(event.target.value)}
                  aria-label={"변경 사유"}
                />
              </TextField>
              {priceEffect && (
                <Alert style={{ marginTop: 8 }} status={"warning"} role="alert">
                  <Alert.Content>{priceEffect}</Alert.Content>
                </Alert>
              )}
              <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                <Checkbox
                  isSelected={confirmed}
                  isDisabled={!lifeStage || isSame || !reason.trim() || saving}
                  onChange={(isSelected) => setConfirmed(isSelected)}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label>{"이 회원의 생활 단계를 바꿉니다. (요금에 바로 반영)"}</Label>
                  </Checkbox.Content>
                </Checkbox>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex-wrap gap-2">
            <Button onClick={onClose} variant={"ghost"} isDisabled={saving} size={"md"} className="rounded-xl">
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              variant={"primary"}
              isDisabled={!canSave || saving}
              size={"md"}
              className="rounded-xl"
            >
              {saving ? "변경 중..." : "변경하기"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
