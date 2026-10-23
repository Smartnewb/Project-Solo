import { Alert, Button, Checkbox, Label, Modal, Spinner } from "@heroui/react";
import { UserRound } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useCorrectUserGender, useGenderCorrectionPreview } from "@/app/admin/hooks/use-users";

type Gender = "MALE" | "FEMALE";

const LABEL: Record<Gender, string> = { MALE: "남성", FEMALE: "여성" };

interface GenderEditModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  onSuccess?: (result: { gender: Gender; rejectedMatches: number }) => void;
}

export default function GenderEditModal({
  open,
  onClose,
  userId,
  userName,
  onSuccess,
}: GenderEditModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = useGenderCorrectionPreview(userId, open);
  const mutation = useCorrectUserGender();
  const saving = mutation.isPending;

  useEffect(() => {
    setConfirmed(false);
    setError(null);
  }, [open]);

  const data = preview.data;
  const current = data?.gender;
  const next: Gender | undefined = current ? (current === "MALE" ? "FEMALE" : "MALE") : undefined;

  const handleSubmit = async () => {
    if (!next || !confirmed) return;
    try {
      setError(null);
      const result = await mutation.mutateAsync({ userId, gender: next });
      onSuccess?.({ gender: next, rejectedMatches: result.rejectedMatches });
      onClose();
    } catch (err: any) {
      setError(err.message || "성별 정정 중 오류가 발생했습니다.");
    }
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !saving) onClose();
      }}
      isDismissable={!saving}
      isKeyboardDismissDisabled={saving}
    >
      <Modal.Container size="md" scroll="inside" className="w-full">
        <Modal.Dialog style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}>
          <Modal.Header>
            <Modal.Heading>
              <div className="flex items-center gap-1">
                <UserRound />
                성별 정정
              </div>
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
            {error && (
              <Alert className="mb-2" status="danger" role="alert">
                <Alert.Content>{error}</Alert.Content>
              </Alert>
            )}
            <div className="mb-3 text-sm text-neutral-700">변경 대상: {userName || userId}</div>
            {preview.isLoading ? (
              <Spinner aria-label="불러오는 중" size="sm" />
            ) : preview.isError || !data || !current || !next ? (
              <Alert status="danger" role="alert">
                <Alert.Content>현재 성별을 불러오지 못했습니다.</Alert.Content>
              </Alert>
            ) : (
              <>
                <div className="mb-3 rounded-lg bg-neutral-50 p-3 text-base font-semibold">
                  {LABEL[current]} → {LABEL[next]}
                </div>
                <ul className="mb-3 space-y-1 text-sm text-neutral-700">
                  <li>
                    상대에게 떠 있는 대기 카드 <b>{data.pendingMatches}장</b>을 내립니다.
                  </li>
                  <li>
                    대화 중 {data.inChatMatches}건 · 열림 {data.openMatches}건은 그대로
                    둡니다.
                  </li>
                  <li>바꾼 관리자와 내린 카드는 변경 이력에 남습니다.</li>
                </ul>
                <Checkbox
                  isSelected={confirmed}
                  isDisabled={saving}
                  onChange={(isSelected) => setConfirmed(isSelected)}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label>본인이 성별을 잘못 고른 것을 확인했습니다.</Label>
                  </Checkbox.Content>
                </Checkbox>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="flex-wrap gap-2">
            <Button onClick={onClose} variant="ghost" isDisabled={saving} size="md" className="rounded-xl">
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              variant="danger"
              isDisabled={!next || !confirmed || saving}
              size="md"
              className="rounded-xl"
            >
              {saving ? "바꾸는 중..." : next ? `${LABEL[next]}으로 정정` : "정정"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
