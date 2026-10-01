"use client";
import { Button, Chip, Modal } from "@heroui/react";

import type { QuestionDetail, Big5Dimension } from "@/types/moment";
import { safeToLocaleString } from "@/app/utils/formatters";

const DIMENSION_LABELS: Record<Big5Dimension, string> = {
  openness: "개방성 (Openness)",
  conscientiousness: "성실성 (Conscientiousness)",
  extraversion: "외향성 (Extraversion)",
  agreeableness: "우호성 (Agreeableness)",
  neuroticism: "신경성 (Neuroticism)",
};

interface QuestionDetailDialogProps {
  open: boolean;
  onClose: () => void;
  question: QuestionDetail | null;
}

export default function QuestionDetailDialog({
  open,
  onClose,
  question,
}: QuestionDetailDialogProps) {
  if (!question) return null;

  const formatDateTime = (dateString: string) => {
    return safeToLocaleString(dateString, "ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="max-w-3xl">
          <Modal.Heading>질문 상세</Modal.Heading>
          <Modal.Body>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <Chip size="sm">{DIMENSION_LABELS[question.dimension]}</Chip>
                <Chip size="sm">{question.type}</Chip>
                <Chip size="sm">{question.isActive ? "활성" : "비활성"}</Chip>
              </div>
              <h6>{question.text}</h6>
            </div>
            <hr style={{ marginBlock: 16 }} />
            <p>선택지 (한국어)</p>
            <ul>
              {(Array.isArray(question.options) ? question.options : [])
                .sort((a, b) => a.order - b.order)
                .map((option) => (
                  <li key={option.id}>
                    <span>{`${option.order}. ${option.text}`}</span>
                  </li>
                ))}
            </ul>
            {question.translations?.jp && (
              <>
                <hr style={{ marginBlock: 16 }} />
                <p>일본어 번역</p>
                <p style={{ marginBottom: 16 }}>
                  {question.translations.jp.text}
                </p>
                <ul>
                  {(Array.isArray(question.translations.jp.options)
                    ? question.translations.jp.options
                    : []
                  )
                    .sort((a, b) => a.order - b.order)
                    .map((option, index) => (
                      <li key={index}>
                        <span>{`${option.order}. ${option.text}`}</span>
                      </li>
                    ))}
                </ul>
              </>
            )}
            <hr style={{ marginBlock: 16 }} />
            <div style={{ display: "flex", gap: 32 }}>
              <div>
                <p>순서 인덱스</p>
                <p>{question.orderIndex}</p>
              </div>
              <div>
                <p>생성일</p>
                <p>{formatDateTime(question.createdAt)}</p>
              </div>
              <div>
                <p>수정일</p>
                <p>{formatDateTime(question.updatedAt)}</p>
              </div>
            </div>
            {question.metadata && (
              <>
                <hr style={{ marginBlock: 16 }} />
                <p>메타데이터</p>
                {question.metadata.theme && (
                  <p>테마: {question.metadata.theme}</p>
                )}
                {Array.isArray(question.metadata.keywords) && (
                  <div style={{ marginTop: 8 }}>
                    {question.metadata.keywords.map((kw) => (
                      <Chip key={kw} size="sm">
                        {kw}
                      </Chip>
                    ))}
                  </div>
                )}
              </>
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
