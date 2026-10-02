import {
  Alert,
  Button,
  Input,
  Label,
  Modal,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";

import AdminService from "@/app/services/admin";

interface EmailNotificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
}

const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  open,
  onClose,
  userId,
  userEmail,
  userName,
  onSuccess,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setMessage("");
    setError(null);
    setSuccess(false);
  }, [open, userId]);

  const handleSubmit = async () => {
    if (!userId || !subject.trim() || !message.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await AdminService.userAppearance.sendEmailNotification(
        userId,
        subject,
        message,
      );

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || "이메일 공지사항 발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSubject("");
    setMessage("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose?.();
      }}
      isDismissable={!loading}
      isKeyboardDismissDisabled={loading}
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
                이메일 발송
              </div>
            </Modal.Heading>
            <Button
              onClick={handleClose}
              aria-label="닫기"
              variant={"ghost"}
              isDisabled={loading}
              isIconOnly={true}
              size={"md"}
              className="rounded-lg"
            >
              <X />
            </Button>
          </Modal.Header>
          <Modal.Body className="min-w-0 [overflow-wrap:anywhere]">
            <div style={{ marginTop: 8 }}>
              {userEmail && (
                <div style={{ marginBottom: 12 }}>
                  <div className={"text-sm text-neutral-700"}>수신자</div>
                  <div
                    style={{ fontWeight: "medium" }}
                    className={"text-sm text-neutral-700"}
                  >
                    {userName ? `${userName} (${userEmail})` : userEmail}
                  </div>
                </div>
              )}
              <TextField
                className="w-full"
                isDisabled={loading}
                isInvalid={undefined}
              >
                <Label>{"제목"}</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="이메일 제목을 입력하세요"
                  aria-label={"제목"}
                />
              </TextField>
              <TextField
                className="w-full"
                isDisabled={loading}
                isInvalid={undefined}
              >
                <Label>{"내용"}</Label>
                <TextArea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="이메일 내용을 입력하세요"
                  rows={6}
                  aria-label={"내용"}
                />
              </TextField>
              {error && (
                <Alert style={{ marginTop: 8 }} status="danger" role="alert">
                  <Alert.Content>{error}</Alert.Content>
                </Alert>
              )}
              {success && (
                <Alert style={{ marginTop: 8 }} status={"success"} role="alert">
                  <Alert.Content>
                    이메일이 성공적으로 발송되었습니다.
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
                loading || success || !subject.trim() || !message.trim()
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

export default EmailNotificationModal;
