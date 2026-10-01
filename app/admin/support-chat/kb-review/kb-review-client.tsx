"use client";
import {
  Button,
  Chip,
  FieldError,
  Label,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";

import { useState, useCallback, useEffect } from "react";

type KbCategory = "new" | "update" | "covered";
type KbStatus = "pending" | "approved" | "rejected";

interface KbCandidate {
  id: string;
  clusterLabel: string;
  representativeQ: string;
  frequency: number;
  category: KbCategory;
  matchedKbRef: string | null;
  kbAnswer: string | null;
  operatorAnswer: string | null;
  proposedQa: { question: string; answer: string } | null;
  language: string;
  domain: string;
  status: KbStatus;
}

function CategoryChip({ category }: { category: KbCategory }) {
  if (category === "new") {
    return <Chip size="sm">{"신규"}</Chip>;
  }
  if (category === "update") {
    return <Chip size="sm">{"갱신"}</Chip>;
  }
  return <Chip size="sm">{"커버됨"}</Chip>;
}

interface CandidateCardProps {
  candidate: KbCandidate;
  onRefresh: () => void;
}

function CandidateCard({ candidate, onRefresh }: CandidateCardProps) {
  const {
    id,
    clusterLabel,
    representativeQ,
    frequency,
    category,
    kbAnswer,
    operatorAnswer,
    proposedQa,
    language,
    domain,
  } = candidate;

  const initialQ = proposedQa?.question ?? representativeQ;
  const initialA = proposedQa?.answer ?? operatorAnswer ?? "";

  const [editedQuestion, setEditedQuestion] = useState(initialQ);
  const [editedAnswer, setEditedAnswer] = useState(initialA);
  const [acting, setActing] = useState<
    "approve" | "approve-edit" | "reject" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const postAction = useCallback(
    async (type: "approve" | "approve-edit" | "reject") => {
      setActing(type);
      setActionError(null);
      try {
        const isReject = type === "reject";
        const url = isReject
          ? `/api/admin/kb-candidates/${id}/reject`
          : `/api/admin/kb-candidates/${id}/approve`;

        const body =
          type === "approve-edit"
            ? JSON.stringify({ editedQuestion, editedAnswer })
            : undefined;

        const res = await fetch(url, {
          method: "POST",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setActionError(data?.error ?? `요청 실패 (HTTP ${res.status})`);
          return;
        }

        onRefresh();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "네트워크 오류");
      } finally {
        setActing(null);
      }
    },
    [id, editedQuestion, editedAnswer, onRefresh],
  );

  const isActing = acting !== null;

  return (
    <div style={{ padding: 20 }}>
      <div className="flex flex-col gap-3 min-w-0">
        {/* Header row */}
        <div className="flex flex-row gap-3 min-w-0">
          <CategoryChip category={category} />
          <Chip size="sm">{language.toUpperCase()}</Chip>
          <Chip size="sm">{`domain: ${domain}`}</Chip>
          <Chip size="sm">{`빈도 ${frequency}회`}</Chip>
          {clusterLabel && <Chip size="sm">{clusterLabel}</Chip>}
        </div>

        {/* Representative question */}
        <div>
          <p>대표 질문</p>
          <p style={{ marginTop: 2 }}>{representativeQ}</p>
        </div>

        {/* For 'update' category: side-by-side diff of KB answer vs operator answer */}
        {category === "update" && (kbAnswer || operatorAnswer) && (
          <div>
            <p style={{ marginBottom: 8, display: "block" }}>
              기존 KB vs 운영자 답변 비교
            </p>
            <div className="flex flex-col md:flex-row gap-3 min-w-0">
              <div
                style={{
                  flex: 1,
                  border: "1px solid #e4e4e7",
                  borderColor: "#e4e4e7",
                  borderRadius: 1,
                  padding: 12,
                }}
              >
                <p>기존 KB 답변</p>
                <p
                  style={{
                    marginTop: 4,
                    whiteSpace: "pre-wrap",
                    color: "#52525b",
                  }}
                >
                  {kbAnswer ?? "(없음)"}
                </p>
              </div>
              <div
                style={{
                  flex: 1,
                  border: 2,
                  borderColor: "warning.main",
                  borderRadius: 1,
                  padding: 12,
                  backgroundColor: "warning.50",
                }}
              >
                <p>운영자 답변 (변경안)</p>
                <p
                  style={{
                    marginTop: 4,
                    whiteSpace: "pre-wrap",
                    color: "#52525b",
                  }}
                >
                  {operatorAnswer ?? "(없음)"}
                </p>
              </div>
            </div>
          </div>
        )}

        <hr />

        {/* Editable proposed Q-A */}
        <div>
          <p style={{ marginBottom: 8, display: "block" }}>
            제안 Q-A (수정 후 승인 시 반영)
          </p>
          <div className="flex flex-col gap-3 min-w-0">
            <TextField className="flex-1 min-w-0">
              <Label>{"질문"}</Label>
              <TextArea
                rows={2}
                value={editedQuestion}
                onChange={(e) => setEditedQuestion(e.target.value)}
                disabled={isActing}
              />
            </TextField>
            <TextField className="flex-1 min-w-0">
              <Label>{"답변"}</Label>
              <TextArea
                rows={3}
                value={editedAnswer}
                onChange={(e) => setEditedAnswer(e.target.value)}
                disabled={isActing}
              />
            </TextField>
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="rounded-lg border border-default p-3 text-sm"
            style={{ paddingBlock: 0 }}
          >
            {actionError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-row gap-3 min-w-0">
          <Button
            onClick={() => postAction("approve")}
            variant={"primary"}
            isDisabled={isActing}
          >
            {acting === "approve" ? (
              <Spinner aria-label="로딩 중" />
            ) : undefined}
            승인
          </Button>
          <Button
            onClick={() => postAction("approve-edit")}
            variant={"primary"}
            isDisabled={
              isActing || (!editedQuestion.trim() && !editedAnswer.trim())
            }
          >
            {acting === "approve-edit" ? (
              <Spinner aria-label="로딩 중" />
            ) : undefined}
            수정 후 승인
          </Button>
          <Button
            onClick={() => postAction("reject")}
            variant={"secondary"}
            isDisabled={isActing}
          >
            {acting === "reject" ? <Spinner aria-label="로딩 중" /> : undefined}
            기각
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function KbReviewClient() {
  const [candidates, setCandidates] = useState<KbCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/kb-candidates");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `목록 조회 실패 (HTTP ${res.status})`);
        return;
      }
      const items: KbCandidate[] = Array.isArray(data)
        ? data
        : (data?.items ?? []);
      setCandidates(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCandidates();
  }, [fetchCandidates]);

  return (
    <div
      style={{
        padding: 24,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Page header */}
      <div>
        <div className="flex flex-row gap-3 min-w-0">
          <div>
            <h5>KB 검수 큐</h5>
            <p>
              운영자 답변 클러스터를 검토하고 KB에 반영할 항목을 승인 또는
              기각합니다.
            </p>
          </div>
          <Button
            onClick={fetchCandidates}
            variant={"secondary"}
            isDisabled={loading}
          >
            {loading ? <Spinner aria-label="로딩 중" /> : undefined}새로고침
          </Button>
        </div>
      </div>
      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
        >
          {error}
        </div>
      )}
      {/* Loading state */}
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBlock: 48,
          }}
        >
          <Spinner aria-label="로딩 중" />
        </div>
      )}
      {/* Empty state */}
      {!loading && !error && candidates.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: "#52525b" }}>
          <p>검수 대기 항목이 없습니다.</p>
        </div>
      )}
      {/* Candidate list */}
      {!loading && candidates.length > 0 && (
        <div style={{ flex: 1, overflow: "auto" }}>
          <p style={{ marginBottom: 12 }}>대기 중 {candidates.length}건</p>
          <div className="flex flex-col gap-3 min-w-0">
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                onRefresh={fetchCandidates}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
