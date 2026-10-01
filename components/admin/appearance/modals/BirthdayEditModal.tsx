import {
  Alert,
  Button,
  Checkbox,
  Input,
  Label,
  Modal,
  Separator,
  TextField,
} from "@heroui/react";
import { Cake } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { calculateAge } from "@/app/utils/formatters";
import { useUpdateUserBirthday } from "@/app/admin/hooks/use-users";

const MIN_AGE = 18;
const MAX_AGE = 27;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface BirthdayEditModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  currentBirthday?: string | null;
  currentAge?: number;
  onSuccess?: (result: { birthday: string; age: number }) => void;
}

export default function BirthdayEditModal({
  open,
  onClose,
  userId,
  userName,
  currentBirthday,
  currentAge,
  onSuccess,
}: BirthdayEditModalProps) {
  const [birthday, setBirthday] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useUpdateUserBirthday();
  const saving = mutation.isPending;

  useEffect(() => {
    if (!open) {
      setBirthday("");
      setConfirmed(false);
      setError(null);
      return;
    }
    setBirthday(currentBirthday ?? "");
    setConfirmed(false);
    setError(null);
  }, [open, currentBirthday]);

  const validFormat = DATE_RE.test(birthday);
  const previewAge = useMemo(() => {
    if (!DATE_RE.test(birthday)) return Number.NaN;
    return calculateAge(birthday);
  }, [birthday]);

  const outOfRange =
    Number.isFinite(previewAge) &&
    (previewAge < MIN_AGE || previewAge > MAX_AGE);
  const isSame = birthday === (currentBirthday ?? "");
  const canSave = Boolean(validFormat && !outOfRange && !isSame && confirmed);

  const handleSubmit = async () => {
    if (!canSave) return;
    try {
      setError(null);
      const result = await mutation.mutateAsync({ userId, birthday });
      onSuccess?.({ birthday: result.birthday, age: result.age });
      onClose();
    } catch (err: any) {
      setError(err.message || "생년월일 변경 중 오류가 발생했습니다.");
    }
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) (saving ? undefined : onClose)?.();
      }}
      isDismissable={(saving ? undefined : onClose) !== undefined}
    >
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Cake />
                생년월일(나이) 변경
              </div>
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div style={{ paddingTop: 4 }}>
              {error && (
                <Alert style={{ marginBottom: 8 }} status="danger" role="alert">
                  <Alert.Content>{error}</Alert.Content>
                </Alert>
              )}
              <div style={{ marginBottom: 8 }}>
                <div className={"text-sm text-neutral-700"}>변경 대상</div>
                <div className={"text-sm text-neutral-700"}>
                  {userName || userId}
                </div>
              </div>
              <div
                style={{
                  padding: 8,
                  backgroundColor: "#fafafa",
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              >
                <div className={"text-sm text-neutral-700"}>현재 정보</div>
                <div className={"text-sm text-neutral-700"}>
                  {currentBirthday || "생년월일 없음"}
                  {typeof currentAge === "number"
                    ? ` · 만 ${currentAge}세`
                    : ""}
                </div>
              </div>
              <Separator style={{ marginBottom: 8 }}></Separator>
              <TextField
                className="w-full"
                isDisabled={saving}
                isInvalid={undefined}
              >
                <Label>{"변경할 생년월일"}</Label>
                <Input
                  type="date"
                  value={birthday}
                  onChange={(event) => {
                    setBirthday(event.target.value);
                    setConfirmed(false);
                  }}
                  aria-label={"변경할 생년월일"}
                />
              </TextField>
              {Number.isFinite(previewAge) && (
                <div
                  style={{ marginTop: 4 }}
                  className={"text-sm text-neutral-700"}
                >
                  만 나이: {previewAge}세
                </div>
              )}
              {outOfRange && (
                <Alert style={{ marginTop: 8 }} status={"warning"} role="alert">
                  <Alert.Content>
                    허용 연령({MIN_AGE}~{MAX_AGE}세)을 벗어납니다. 서버에서
                    거부됩니다.
                  </Alert.Content>
                </Alert>
              )}
              {isSame && birthday && (
                <Alert style={{ marginTop: 8 }} status={"default"} role="alert">
                  <Alert.Content>현재 생년월일과 동일합니다.</Alert.Content>
                </Alert>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  isSelected={confirmed}
                  isDisabled={!validFormat || outOfRange || isSame || saving}
                  isIndeterminate={undefined}
                  onChange={(isSelected) => setConfirmed(isSelected)}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label>
                      {
                        "이 유저의 생년월일과 나이를 변경합니다. (매칭 점수에 즉시 반영)"
                      }
                    </Label>
                  </Checkbox.Content>
                </Checkbox>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={onClose}
              variant={"ghost"}
              isDisabled={saving}
              size={"md"}
              className="rounded-xl"
            >
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
