"use client";
import {
  Select,
  ListBox,
  Button,
  Chip,
  FieldError,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  Tooltip,
} from "@heroui/react";
import {
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  X as CloseIcon,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import type { SupportDomain } from "@/app/types/support-chat";
import {
  QUICK_REPLY_VARIABLES,
  addQuickReply,
  applyQuickReplyVariables,
  getQuickReplies,
  removeQuickReply,
  sortRepliesForDomain,
  type QuickReply,
} from "../lib/quick-replies";

interface QuickReplyDialogProps {
  open: boolean;
  onClose: () => void;
  /** 현재 세션 도메인(우선 정렬용) */
  /** 현재 세션 도메인(우선 정렬용) */
  /** 현재 세션 도메인(우선 정렬용) */
  /** 현재 세션 도메인(우선 정렬용) */
  domain?: SupportDomain;
  /** 변수 치환용 닉네임 */
  /** 변수 치환용 닉네임 */
  /** 변수 치환용 닉네임 */
  /** 변수 치환용 닉네임 */
  nickname?: string;
  /** 선택한 템플릿(치환 적용된 본문)을 입력창에 삽입 */
  /** 선택한 템플릿(치환 적용된 본문)을 입력창에 삽입 */
  /** 선택한 템플릿(치환 적용된 본문)을 입력창에 삽입 */
  /** 선택한 템플릿(치환 적용된 본문)을 입력창에 삽입 */
  onSelect: (content: string) => void;
}

export default function QuickReplyDialog({
  open,
  onClose,
  domain,
  nickname,
  onSelect,
}: QuickReplyDialogProps) {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    if (open) {
      setReplies(getQuickReplies());
      setCreating(false);
      setNewTitle("");
      setNewContent("");
    }
  }, [open]);

  const sorted = useMemo(
    () => sortRepliesForDomain(replies, domain),
    [replies, domain],
  );

  const handleSelect = (reply: QuickReply) => {
    onSelect(applyQuickReplyVariables(reply.content, { nickname }));
    onClose();
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setReplies(
      addQuickReply({
        domain: domain ?? "all",
        title: newTitle,
        content: newContent,
      }),
    );
    setCreating(false);
    setNewTitle("");
    setNewContent("");
  };

  const handleRemove = (id: string) => {
    setReplies(removeQuickReply(id));
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
          <Modal.Heading
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            빠른 답변 템플릿
            <Button
              onClick={onClose}
              aria-label="닫기"
              variant={"secondary"}
              isIconOnly
            >
              <CloseIcon size={16} />
            </Button>
          </Modal.Heading>
          <Modal.Body>
            <ul style={{ paddingBlock: 0 }}>
              {sorted.map((reply) => (
                <Button
                  variant="secondary"
                  key={reply.id}
                  onClick={() => handleSelect(reply)}
                  className="w-full justify-start h-auto p-3 mb-1"
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <p style={{ fontWeight: 700 }}>{reply.title}</p>
                      {reply.domain !== "all" && (
                        <Chip size="sm">{reply.domain}</Chip>
                      )}
                      {reply.builtin && <Chip size="sm">{"기본"}</Chip>}
                    </div>
                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {reply.content}
                    </p>
                  </div>
                  {!reply.builtin && (
                    <Tooltip>
                      <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(reply.id);
                          }}
                          aria-label="템플릿 삭제"
                          variant={"secondary"}
                          isIconOnly
                        >
                          <DeleteIcon size={16} />
                        </Button>
                      <Tooltip.Content>{"삭제"}</Tooltip.Content>
                    </Tooltip>
                  )}
                </Button>
              ))}
            </ul>
            <hr style={{ marginBlock: 12 }} />
            {creating ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <TextField className="flex-1 min-w-0">
                  <Label>{"템플릿 제목"}</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    {...{ maxLength: 40 }}
                    autoFocus
                  />
                </TextField>
                <TextField className="flex-1 min-w-0">
                  <Label>{"답변 내용"}</Label>
                  <TextArea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    {...{ maxLength: 2000 }}
                  />
                </TextField>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {QUICK_REPLY_VARIABLES.map((v) => (
                    <Button
                      variant="secondary"
                      size="sm"
                      key={v.token}
                      onClick={() =>
                        setNewContent((prev) => `${prev}${v.token}`)
                      }
                    >{`${v.label} ${v.token}`}</Button>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <Button
                    onClick={() => setCreating(false)}
                    variant={"secondary"}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCreate}
                    variant={"primary"}
                    isDisabled={!newTitle.trim() || !newContent.trim()}
                  >
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setCreating(true)} variant={"secondary"}>
                {<AddIcon size={16} />}새 템플릿 추가
              </Button>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={onClose} variant={"secondary"}>
              닫기
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
