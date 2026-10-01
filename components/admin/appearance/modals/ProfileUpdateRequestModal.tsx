import {
  Alert,
  Button,
  Checkbox,
  Description,
  Label,
  Modal,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { Edit } from "lucide-react";
import React, { useState } from "react";

import AdminService from "@/app/services/admin";

interface ProfileUpdateRequestModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const ProfileUpdateRequestModal: React.FC<ProfileUpdateRequestModalProps> = ({
  open,
  onClose,
  userId,
  onSuccess,
}) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);

  const handleUseTemplate = () => {
    setUseTemplate(!useTemplate);
    if (!useTemplate) {
      setMessage(
        "프로필 사진 또는 정보를 업데이트해 주세요. 더 나은 매칭 서비스를 위해 최신 정보가 필요합니다.",
      );
    }
  };

  const handleSubmit = async () => {
    if (!userId || !message.trim()) return;

    try {
      setLoading(true);
      setError(null);

      await AdminService.userAppearance.sendProfileUpdateRequest(
        userId,
        message,
      );

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(
        error.message || "프로필 수정 요청 발송 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMessage("");
      setError(null);
      setSuccess(false);
      setUseTemplate(false);
      onClose();
    }
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose?.();
      }}
      isDismissable={handleClose !== undefined}
    >
      <Modal.Container size="md" scroll="inside" className="w-full">
        <Modal.Dialog style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}>
          <Modal.Header>
            <Modal.Heading>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Edit />
                프로필 수정 요청
              </div>
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
            {success ? (
              <Alert style={{ marginTop: 8 }} status={"success"} role="alert">
                <Alert.Content>
                  프로필 수정 요청이 성공적으로 기록되었습니다.
                </Alert.Content>
              </Alert>
            ) : (
              <div style={{ paddingTop: 8 }}>
                {error && (
                  <Alert
                    style={{ marginBottom: 8 }}
                    status="danger"
                    role="alert"
                  >
                    <Alert.Content>{error}</Alert.Content>
                  </Alert>
                )}
                <div
                  style={{ marginBottom: 8 }}
                  className={"text-sm text-neutral-700"}
                >
                  프로필 수정 요청 이력에 메모를 기록합니다. 현재 이 기능은 앱
                  내 알림을 보내지 않습니다.
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    isSelected={useTemplate}
                    isDisabled={loading}
                    isIndeterminate={undefined}
                    onChange={(isSelected) => handleUseTemplate()}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Label>{"기본 템플릿 사용"}</Label>
                    </Checkbox.Content>
                  </Checkbox>
                </div>
                <TextField
                  className="w-full"
                  isDisabled={loading}
                  isInvalid={message.trim() === ""}
                >
                  <Label>{"요청 메시지"}</Label>
                  <TextArea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="프로필 수정 요청 내용을 입력하세요"
                    required
                    rows={4}
                    aria-label={"요청 메시지"}
                  />
                  <Description>
                    {message.trim() === "" ? "메시지를 입력해주세요" : ""}
                  </Description>
                </TextField>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="flex-wrap gap-2">
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
              isDisabled={loading || success || message.trim() === ""}
              size={"md"}
              className="rounded-xl"
            >
              {loading ? <Spinner aria-label="불러오는 중" size="sm" /> : null}
              {loading ? "발송 중..." : "발송하기"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default ProfileUpdateRequestModal;
