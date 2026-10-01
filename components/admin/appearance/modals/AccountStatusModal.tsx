import {
  Alert,
  Button,
  Checkbox,
  Description,
  Label,
  ListBox,
  Modal,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import React, { useEffect, useState } from "react";

import AdminService from "@/app/services/admin";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";

export type SuspendDurationDays = 3 | 7 | 14 | 30;

interface AccountStatusModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  /** true면 정지 해제, false면 계정 정지 */
  /** true면 정지 해제, false면 계정 정지 */
  isSuspended: boolean;
  userName?: string;
  onSuccess?: (message: string) => void;
}

const DURATION_OPTIONS: SuspendDurationDays[] = [3, 7, 14, 30];

const AccountStatusModal: React.FC<AccountStatusModalProps> = ({
  open,
  onClose,
  userId,
  isSuspended,
  userName,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [suspendType, setSuspendType] = useState<"permanent" | "temporary">(
    "permanent",
  );
  const [durationDays, setDurationDays] = useState<SuspendDurationDays>(7);
  const [localNote, setLocalNote] = useState("");
  const [sendNotice, setSendNotice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setSuspendType("permanent");
    setDurationDays(7);
    setLocalNote("");
    setSendNotice(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage("");
    setLoading(false);
  }, [open, isSuspended, userId]);

  const canSubmitSuspend = reason.trim().length > 0;
  const title = isSuspended ? "정지 해제" : "계정 정지";

  const handleSubmit = async () => {
    if (!userId || loading || success) return;

    if (!isSuspended && !canSubmitSuspend) {
      setError("정지 사유를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isSuspended) {
        await AdminService.userAppearance.unsuspendUser(userId);
        const msg = "계정 정지가 해제되었습니다.";
        setSuccessMessage(msg);
        setSuccess(true);
        onSuccess?.(msg);
      } else {
        await AdminService.userAppearance.suspendUser(userId, {
          reason: reason.trim(),
          sendNotice,
          ...(suspendType === "permanent"
            ? { permanent: true }
            : { durationDays }),
        });
        const msg = sendNotice
          ? "제재 완료. 유저 고지 발송을 요청했습니다."
          : "제재 완료. 운영자 선택으로 고지는 보내지 않았습니다.";
        setSuccessMessage(msg);
        setSuccess(true);
        onSuccess?.(msg);
      }

      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err: unknown) {
      setError(
        getAdminErrorMessage(
          err,
          isSuspended
            ? "정지 해제 중 오류가 발생했습니다."
            : "계정 정지 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReason("");
    setSuspendType("permanent");
    setDurationDays(7);
    setLocalNote("");
    setSendNotice(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage("");
    onClose();
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
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            {success ? (
              <Alert style={{ marginTop: 8 }} status={"success"} role="alert">
                <Alert.Content>
                  {successMessage ||
                    (isSuspended
                      ? "계정 정지가 해제되었습니다."
                      : "계정 정지가 완료되었습니다.")}
                </Alert.Content>
              </Alert>
            ) : (
              <div style={{ paddingTop: 8 }}>
                {userName && (
                  <div
                    style={{ marginBottom: 8 }}
                    className={"text-sm text-neutral-700"}
                  >
                    대상: <strong>{userName}</strong>
                  </div>
                )}
                {error && (
                  <Alert
                    style={{ marginBottom: 8 }}
                    status="danger"
                    role="alert"
                  >
                    <Alert.Content>{error}</Alert.Content>
                  </Alert>
                )}
                {isSuspended ? (
                  <>
                    <Alert
                      style={{ marginBottom: 8 }}
                      status={"default"}
                      role="alert"
                    >
                      <Alert.Content>
                        정지를 해제하면 사용자가 다시 로그인·이용할 수 있습니다.
                      </Alert.Content>
                    </Alert>
                    <TextField
                      className="w-full"
                      isDisabled={loading}
                      isInvalid={undefined}
                    >
                      <Label>{"내부 메모 (선택)"}</Label>
                      <TextArea
                        value={localNote}
                        onChange={(e) => setLocalNote(e.target.value)}
                        placeholder="해제 사유를 내부용으로 남겨둘 수 있습니다. API로는 전송되지 않습니다."
                        rows={3}
                        aria-label={"내부 메모 (선택)"}
                      />
                      <Description>
                        {
                          "메모는 이 화면에서만 확인 가능하며 서버에 저장되지 않습니다."
                        }
                      </Description>
                    </TextField>
                  </>
                ) : (
                  <>
                    <Alert
                      style={{ marginBottom: 8 }}
                      status={"warning"}
                      role="alert"
                    >
                      <Alert.Content>
                        <div
                          style={{ fontWeight: 700, marginBottom: 2 }}
                          className={"text-sm text-neutral-700"}
                        >
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
                          문구에 정지/이용제한 사유와 7일 이내 소명 안내가
                          포함됩니다.
                        </div>
                        <div className={"text-sm text-neutral-700"}>
                          직접 발송 번호/이메일 안내는 백엔드 템플릿 기준입니다.
                        </div>
                      </Alert.Content>
                    </Alert>

                    <div style={{ marginBottom: 8 }}>
                      <Label>정지 유형</Label>
                      <RadioGroup
                        value={suspendType}
                        onChange={(isSelected) =>
                          setSuspendType(
                            isSelected as "permanent" | "temporary",
                          )
                        }
                      >
                        <Radio value={"permanent"}>
                          <Radio.Content>
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <Label>{"영구 정지"}</Label>
                          </Radio.Content>
                        </Radio>
                        <Radio value={"temporary"}>
                          <Radio.Content>
                            <Radio.Control>
                              <Radio.Indicator />
                            </Radio.Control>
                            <Label>{"기간 정지"}</Label>
                          </Radio.Content>
                        </Radio>
                      </RadioGroup>
                    </div>

                    {suspendType === "temporary" && (
                      <div style={{ marginBottom: 8 }}>
                        <Label id="suspend-duration-label">정지 기간</Label>
                        <Select
                          selectedKey={durationDays}
                          onSelectionChange={(value) =>
                            ((e) =>
                              setDurationDays(
                                Number(e.target.value) as SuspendDurationDays,
                              ))({
                              target: { value },
                            } as React.ChangeEvent<HTMLSelectElement>)
                          }
                          isDisabled={undefined}
                          aria-label={"정지 기간"}
                          className="w-full"
                        >
                          <Label>{"정지 기간"}</Label>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {DURATION_OPTIONS.map((days) => (
                                <ListBox.Item
                                  key={days}
                                  id={days}
                                  textValue={"days일\n                        "}
                                >
                                  {days}일
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>
                    )}

                    <TextField
                      className="w-full"
                      isDisabled={loading}
                      isInvalid={!reason.trim()}
                    >
                      <Label>{"정지 사유"}</Label>
                      <TextArea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="정지 사유를 입력하세요 (필수)"
                        required
                        rows={4}
                        aria-label={"정지 사유"}
                      />
                      <Description>
                        {"사유는 운영 기록 및 약관 고지 처리에 사용됩니다."}
                      </Description>
                    </TextField>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        isSelected={sendNotice}
                        isDisabled={loading}
                        isIndeterminate={undefined}
                        onChange={(isSelected) => setSendNotice(isSelected)}
                        style={{ paddingTop: 1 }}
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
                      <Alert
                        style={{ marginTop: 4, marginBottom: 4 }}
                        status="danger"
                        role="alert"
                      >
                        <Alert.Content>
                          고지 없이 제재합니다. 약관 고지 누락 위험이 있으니
                          특별한 경우에만 사용하세요.
                        </Alert.Content>
                      </Alert>
                    )}

                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        backgroundColor: "rgba(237, 108, 2, 0.06)",
                        borderRadius: 4,
                        border: "1px solid",
                        borderColor: "warning.light",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "warning.dark",
                          marginBottom: 2,
                        }}
                        className={"text-sm text-neutral-700"}
                      >
                        처리 안내 · 계정 정지
                      </div>
                      <div
                        style={{ marginBottom: 2 }}
                        className={"text-sm text-neutral-700"}
                      >
                        · 이용 제한 + 기본 고지(인앱 알림+SMS). 고지 OFF는 위
                        체크박스로만 가능합니다.
                      </div>
                      <div
                        style={{ marginBottom: 2 }}
                        className={"text-sm text-neutral-700"}
                      >
                        · 계정 정지 시 사용자가 앱에 로그인할 수 없습니다.
                      </div>
                      <div className={"text-sm text-neutral-700"}>
                        · 영구 차단(블랙리스트)이 필요하면 상단의 블랙리스트
                        버튼을 사용하세요. 블랙리스트도 기본 고지가 발송됩니다.
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={handleClose}
              variant={"ghost"}
              isDisabled={loading}
              size={"md"}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              variant={"primary"}
              isDisabled={
                loading || success || (!isSuspended && !canSubmitSuspend)
              }
              size={"md"}
              className="rounded-xl"
            >
              {loading ? <Spinner aria-label="불러오는 중" size="sm" /> : null}
              {loading ? "처리 중..." : isSuspended ? "정지 해제" : "계정 정지"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default AccountStatusModal;
