"use client";
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";

import { useState, useEffect } from "react";

import type { QuestionDetail } from "@/types/moment";

interface QuestionEditDialogProps {
  open: boolean;
  onClose: () => void;
  question: QuestionDetail | null;
  onSave: (
    id: string,
    data: { text?: string; options?: { text: string; order: number }[] },
  ) => Promise<void>;
  processing: boolean;
}

export default function QuestionEditDialog({
  open,
  onClose,
  question,
  onSave,
  processing,
}: QuestionEditDialogProps) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState<{ text: string; order: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setText(question.text);
      setOptions(
        (Array.isArray(question.options) ? question.options : [])
          .sort((a, b) => a.order - b.order)
          .map((o) => ({ text: o.text, order: o.order })),
      );
    }
  }, [question]);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, text: value } : opt)),
    );
  };

  const handleSave = async () => {
    if (!question) return;

    if (!text.trim()) {
      setError("질문 텍스트를 입력해주세요.");
      return;
    }

    if (options.some((o) => !o.text.trim())) {
      setError("모든 선택지를 입력해주세요.");
      return;
    }

    setError(null);

    try {
      await onSave(question.id, {
        text: text.trim(),
        options: options.map((o) => ({ text: o.text.trim(), order: o.order })),
      });
    } catch (err) {
      setError("저장에 실패했습니다.");
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!question) return null;

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="max-w-3xl">
          <Modal.Heading>질문 수정</Modal.Heading>
          <Modal.Body>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-default p-3 text-sm"
                style={{ marginBottom: 16 }}
              >
                {error}
                <Button
                  variant="secondary"
                  aria-label="알림 닫기"
                  onClick={() => setError(null)}
                >
                  닫기
                </Button>
              </div>
            )}
            <TextField style={{ marginBottom: 24 }}>
              <Label>{"질문 텍스트"}</Label>
              <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </TextField>
            <p>선택지 (5개 필수)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {options.map((option, index) => (
                <TextField key={index}>
                  <Label>{`선택지 ${option.order}`}</Label>
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                </TextField>
              ))}
            </div>
            <div
              role="alert"
              className="rounded-lg border border-default p-3 text-sm"
              style={{ marginTop: 16 }}
            >
              번역된 질문(JP 스키마)은 자동으로 업데이트되지 않습니다. 수정 후
              다시 번역해주세요.
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={handleClose}
              variant={"secondary"}
              isDisabled={processing}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              variant={"primary"}
              isDisabled={processing}
            >
              {processing ? <Spinner aria-label="로딩 중" /> : "저장"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
