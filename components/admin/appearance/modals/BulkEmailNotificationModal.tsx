import {
  Alert,
  Button,
  Input,
  Label,
  Modal,
  ProgressBar,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { X } from "lucide-react";
import React, { useState } from "react";

import AdminService from "@/app/services/admin";

interface BulkEmailNotificationModalProps {
  open: boolean;
  onClose: () => void;
  userIds: string[];
  onSuccess?: () => void;
}

const BulkEmailNotificationModal: React.FC<BulkEmailNotificationModalProps> = ({
  open,
  onClose,
  userIds,
  onSuccess,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalEmails, setTotalEmails] = useState(0);
  const [sentEmails, setSentEmails] = useState(0);

  const handleSubmit = async () => {
    if (userIds.length === 0 || !subject.trim() || !message.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setTotalEmails(userIds.length);
      setSentEmails(0);

      // 각 사용자에게 이메일 발송
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        try {
          await AdminService.userAppearance.sendEmailNotification(
            userId,
            subject,
            message,
          );
          successCount++;
        } catch (err) {
          console.error(`사용자 ${userId}에게 이메일 발송 실패:`, err);
          failCount++;
        }

        // 진행 상태 업데이트
        setSentEmails(i + 1);
        setProgress(Math.round(((i + 1) / userIds.length) * 100));
      }

      // 결과 메시지 설정
      if (failCount === 0) {
        setSuccess(true);
      } else {
        setError(
          `${userIds.length}명 중 ${successCount}명에게 이메일을 발송했습니다. ${failCount}명 발송 실패.`,
        );
      }

      if (onSuccess) onSuccess();

      // 성공 후 3초 후에 모달 닫기
      if (failCount === 0) {
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (error: any) {
      setError(error.message || "이메일 발송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSubject("");
      setMessage("");
      setError(null);
      setSuccess(false);
      setProgress(0);
      setTotalEmails(0);
      setSentEmails(0);
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
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog>
          <Modal.Header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Modal.Heading>
              <div className={"text-lg font-semibold text-neutral-900"}>
                일괄 이메일 발송
              </div>
              <Button
                onClick={handleClose}
                aria-label="close"
                variant={"ghost"}
                isDisabled={loading}
                isIconOnly={true}
                size={"md"}
                className="rounded-lg"
              >
                <X />
              </Button>
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 12 }}>
                <div className={"text-sm text-neutral-700"}>수신자</div>
                <div
                  style={{ fontWeight: "medium" }}
                  className={"text-sm text-neutral-700"}
                >
                  선택된 사용자 {userIds.length}명
                </div>
              </div>
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
              {loading && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <div className={"text-sm text-neutral-700"}>
                      발송 진행 중...
                    </div>
                    <div className={"text-sm text-neutral-700"}>
                      {sentEmails}/{totalEmails}
                    </div>
                  </div>
                  <ProgressBar value={progress} aria-label="진행률">
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                </div>
              )}
              {error && (
                <Alert style={{ marginTop: 8 }} status="danger" role="alert">
                  <Alert.Content>{error}</Alert.Content>
                </Alert>
              )}
              {success && (
                <Alert style={{ marginTop: 8 }} status={"success"} role="alert">
                  <Alert.Content>
                    {userIds.length}명의 사용자에게 이메일이 성공적으로
                    발송되었습니다.
                  </Alert.Content>
                </Alert>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer
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
              isDisabled={loading || !subject.trim() || !message.trim()}
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

export default BulkEmailNotificationModal;
