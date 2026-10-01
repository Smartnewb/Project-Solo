import {
  Alert,
  Button,
  Description,
  Label,
  Modal,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { X } from "lucide-react";
import React, { useState } from "react";

import AdminService from "@/app/services/admin";

interface SmsNotificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  phoneNumber?: string;
  userName?: string;
  onSuccess?: () => void;
}

const SmsNotificationModal: React.FC<SmsNotificationModalProps> = ({
  open,
  onClose,
  userId,
  phoneNumber,
  userName,
  onSuccess,
}) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // 문자열의 바이트 수 계산 함수 (한글: 2바이트, 영어/숫자/공백/특수문자: 1바이트)
  const getByteLength = (str: string): number => {
    let byte = 0;
    for (let i = 0; i < str.length; i++) {
      // 한글 체크 (유니코드 범위: AC00-D7A3, 가-힣)
      const charCode = str.charCodeAt(i);
      if (charCode >= 0xac00 && charCode <= 0xd7a3) {
        byte += 2; // 한글은 2바이트
      } else {
        byte += 1; // 그 외 문자는 1바이트
      }
    }
    return byte;
  };

  const [byteCount, setByteCount] = useState(0);

  const MAX_USER_INPUT_BYTE = 69; // 사용자가 입력할 수 있는 최대 바이트 (기본 템플릿 제외)
  const SMS_PREFIX = "[web발신]\n[썸타임]\n"; // SMS 기본 템플릿

  const handleMessageChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const newMessage = e.target.value;
    const messageByte = getByteLength(newMessage);
    setByteCount(messageByte);
    setMessage(newMessage);
  };

  const handleSubmit = async () => {
    if (!userId || !message.trim()) {
      setError("메시지 내용을 입력해주세요.");
      return;
    }

    if (byteCount > MAX_USER_INPUT_BYTE) {
      setError(
        `메시지는 ${MAX_USER_INPUT_BYTE}바이트를 초과할 수 없습니다. (현재: ${byteCount}바이트)`,
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await AdminService.userAppearance.sendSmsNotification(userId, message);

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || "SMS 발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage("");
    setError(null);
    setSuccess(false);
    setByteCount(0);
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
      <Modal.Container size="md" scroll="inside" className="w-full">
        <Modal.Dialog style={{ width: "100%", maxWidth: "32rem", minWidth: 0 }}>
          <Modal.Header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Modal.Heading>
              <div className={"text-lg font-semibold text-neutral-900"}>
                SMS 발송
              </div>
            </Modal.Heading>
            <Button
              onClick={handleClose}
              aria-label="close"
              variant={"ghost"}
              isDisabled={undefined}
              isIconOnly={true}
              size={"md"}
              className="rounded-lg"
            >
              <X />
            </Button>
          </Modal.Header>
          <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
            <div style={{ marginTop: 8 }}>
              {phoneNumber && (
                <div style={{ marginBottom: 12 }}>
                  <div className={"text-sm text-neutral-700"}>수신자</div>
                  <div
                    style={{ fontWeight: "medium" }}
                    className={"text-sm text-neutral-700"}
                  >
                    {userName ? `${userName} (${phoneNumber})` : phoneNumber}
                  </div>
                </div>
              )}
              <TextField
                className="w-full"
                isDisabled={loading}
                isInvalid={byteCount > MAX_USER_INPUT_BYTE}
              >
                <Label>{"메시지"}</Label>
                <TextArea
                  rows={4}
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="SMS 내용을 입력하세요"
                  aria-label={"메시지"}
                />
                <Description>{`${byteCount}/${MAX_USER_INPUT_BYTE}바이트 (한글: 2바이트, 영어/숫자/공백: 1바이트)`}</Description>
              </TextField>
              {error && (
                <Alert style={{ marginTop: 8 }} status="danger" role="alert">
                  <Alert.Content>{error}</Alert.Content>
                </Alert>
              )}
              {success && (
                <Alert style={{ marginTop: 8 }} status={"success"} role="alert">
                  <Alert.Content>
                    SMS가 성공적으로 발송되었습니다.
                  </Alert.Content>
                </Alert>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer
            className="flex-wrap gap-2"
            style={{ paddingLeft: 12, paddingRight: 12, paddingBottom: 12 }}
          >
            <Button
              onClick={handleClose}
              style={{ borderRadius: 8 }}
              variant={"ghost"}
              isDisabled={loading}
              size={"md"}
              className="rounded-xl"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              style={{ borderRadius: 8, position: "relative" }}
              variant={"primary"}
              isDisabled={
                loading || !message.trim() || byteCount > MAX_USER_INPUT_BYTE
              }
              size={"md"}
              className="rounded-xl"
            >
              {loading ? (
                <>
                  <Spinner aria-label="불러오는 중" size="sm" />
                  <span style={{ opacity: 0 }}>발송하기</span>
                </>
              ) : (
                "발송하기"
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default SmsNotificationModal;
