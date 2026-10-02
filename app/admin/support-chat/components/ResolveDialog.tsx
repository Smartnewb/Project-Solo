"use client";
import {
  Select,
  ListBox,
  Button,
  Chip,
  Description,
  Label,
  Modal,
  Spinner,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import { CircleCheck as CheckCircleIcon } from "lucide-react";

import { useEffect, useState } from "react";

import {
  RESOLUTION_REASON_LABELS,
  type SupportResolutionReason,
} from "@/app/types/support-chat";

const RESOLUTION_REASONS: SupportResolutionReason[] = [
  "solved",
  "duplicate",
  "spam",
  "transferred",
  "simple_inquiry",
  "other",
];

const CLOSING_PRESETS: { label: string; message: string }[] = [
  {
    label: "기본 인사",
    message: "문의해 주셔서 감사합니다. 좋은 하루 되세요!",
  },
  {
    label: "해결 확인",
    message:
      "문의주신 내용은 해결된 것으로 확인됩니다. 추가로 불편한 점이 있으면 언제든 다시 문의해 주세요. 감사합니다!",
  },
  {
    label: "추가 안내",
    message:
      "안내드린 내용으로 도움이 되었길 바랍니다. 더 궁금한 점이 생기면 새 문의로 남겨주세요. 감사합니다!",
  },
];

interface ResolveDialogProps {
  open: boolean;
  loading: boolean;
  nickname?: string;
  onClose: () => void;
  /** sendClosingMessage 가 false면 종료 메시지 없이 세션만 종료 */
  /** sendClosingMessage 가 false면 종료 메시지 없이 세션만 종료 */
  /** sendClosingMessage 가 false면 종료 메시지 없이 세션만 종료 */
  /** sendClosingMessage 가 false면 종료 메시지 없이 세션만 종료 */
  onConfirm: (params: {
    closingMessage?: string;
    resolutionReason?: SupportResolutionReason;
  }) => void;
}

export default function ResolveDialog({
  open,
  loading,
  nickname,
  onClose,
  onConfirm,
}: ResolveDialogProps) {
  const [sendClosingMessage, setSendClosingMessage] = useState(true);
  const [message, setMessage] = useState(CLOSING_PRESETS[0].message);
  const [reason, setReason] = useState<SupportResolutionReason>("solved");

  useEffect(() => {
    if (open) {
      setSendClosingMessage(true);
      setMessage(CLOSING_PRESETS[0].message);
      setReason("solved");
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = message.trim();
    if (sendClosingMessage && !trimmed) return;
    onConfirm({
      closingMessage: sendClosingMessage ? trimmed : undefined,
      resolutionReason: reason,
    });
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      isDismissable={!loading}
      isKeyboardDismissDisabled={loading}
      onOpenChange={(isOpen) => {
        if (!isOpen && !loading) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
          <Modal.Heading>문의 해결 완료</Modal.Heading>
          <Modal.Body>
            <p style={{ marginBottom: 16 }}>
              {nickname ? `${nickname}님의 ` : ""}문의를 해결 완료로 처리합니다.
              종료 메시지를 함께 전송할 수 있습니다.
            </p>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>해결 사유</p>
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {RESOLUTION_REASONS.map((r) => (
                <Button
                  variant={reason === r ? "primary" : "secondary"}
                  aria-pressed={reason === r}
                  size="sm"
                  key={r}
                  onClick={() => setReason(r)}
                  isDisabled={loading}
                >
                  {RESOLUTION_REASON_LABELS[r]}
                </Button>
              ))}
            </div>
            <Switch
              isSelected={sendClosingMessage}
              onChange={setSendClosingMessage}
              isDisabled={loading}
              aria-label="종료 메시지 전송"
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label>{"종료 메시지 전송"}</Label>
              </Switch.Content>
            </Switch>
            {sendClosingMessage && (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  {CLOSING_PRESETS.map((preset) => (
                    <Button
                      variant="secondary"
                      size="sm"
                      key={preset.label}
                      onClick={() => setMessage(preset.message)}
                      isDisabled={loading}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <TextField className="flex-1 min-w-0">
                  <Label>{"종료 메시지"}</Label>
                  <TextArea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    {...{ maxLength: 1000 }}
                    disabled={loading}
                  />
                  <Description>{`${message.length}/1000자`}</Description>
                </TextField>
              </>
            )}
            {!sendClosingMessage && (
              <p>메시지 없이 세션만 해결 완료로 전환됩니다.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={onClose}
              variant={"secondary"}
              isDisabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirm}
              variant={"primary"}
              isDisabled={loading || (sendClosingMessage && !message.trim())}
            >
              {loading ? (
                <Spinner aria-label="로딩 중" />
              ) : (
                <CheckCircleIcon size={16} />
              )}
              해결 완료
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
