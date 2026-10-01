"use client";
import { Button, Card, Checkbox, Chip, Spinner } from "@heroui/react";
import {
  Languages as TranslateIcon,
  Eye as PreviewIcon,
  CircleCheck as CheckCircleIcon,
} from "lucide-react";

import { useState, useEffect, useCallback } from "react";

import AdminService from "@/app/services/admin";
import type {
  Big5Dimension,
  QuestionListItem,
  TranslationPreviewItem,
  TranslatePreviewResponse,
  TranslateExecuteResponse,
} from "@/types/moment";
import {
  isTranslatePreviewResponse,
  isTranslateExecuteResponse,
} from "@/types/moment";
import { safeToLocaleDateString } from "@/app/utils/formatters";

const DIMENSION_LABELS: Record<Big5Dimension, string> = {
  openness: "개방성",
  conscientiousness: "성실성",
  extraversion: "외향성",
  agreeableness: "우호성",
  neuroticism: "신경성",
};

type TranslationStep = "select" | "preview" | "result";

export default function QuestionTranslationTab() {
  const [step, setStep] = useState<TranslationStep>("select");
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewData, setPreviewData] =
    useState<TranslatePreviewResponse | null>(null);
  const [resultData, setResultData] = useState<TranslateExecuteResponse | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);

  const fetchUntranslatedQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.getList({
        translationStatus: "kr_only",
        page,
        limit: 15,
        isActive: true,
      });

      setQuestions(Array.isArray(response.questions) ? response.questions : []);
      setTotalPages(response.pagination?.totalPages ?? 1);
      setTotalCount(response.pagination?.total ?? 0);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "질문 목록 조회에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (step === "select") {
      fetchUntranslatedQuestions();
    }
  }, [fetchUntranslatedQuestions, step]);

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const handlePreview = async () => {
    if (selectedIds.size === 0) {
      setError("번역할 질문을 선택해주세요.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.translate({
        questionIds: Array.from(selectedIds),
        targetSchema: "jp",
        preview: true,
      });

      if (isTranslatePreviewResponse(response)) {
        setPreviewData(response);
        setStep("preview");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "미리보기 실패");
    } finally {
      setProcessing(false);
    }
  };

  const handleExecuteTranslation = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.translate({
        questionIds: Array.from(selectedIds),
        targetSchema: "jp",
        preview: false,
      });

      if (isTranslateExecuteResponse(response)) {
        setResultData(response);
        setStep("result");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "번역 실행 실패");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep("select");
    setSelectedIds(new Set());
    setPreviewData(null);
    setResultData(null);
    setPage(1);
    fetchUntranslatedQuestions();
  };

  const formatDate = (dateString: string) => {
    return safeToLocaleDateString(dateString);
  };

  return (
    <div>
      <ol aria-label="번역 진행" className="flex gap-4 mb-6">
        {(["select", "preview", "complete"] as const).map((stage, index) => (
          <li
            key={stage}
            aria-current={step === stage ? "step" : undefined}
            className={step === stage ? "font-semibold" : "text-muted"}
          >
            {index + 1}. {["질문 선택", "번역 미리보기", "완료"][index]}
          </li>
        ))}
      </ol>
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
      {step === "select" && (
        <>
          <div style={{ padding: 16, marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <p>
                번역되지 않은 질문: <strong>{totalCount}개</strong>
              </p>
              <Button
                onClick={handlePreview}
                variant={"primary"}
                isDisabled={selectedIds.size === 0 || processing}
              >
                {processing ? (
                  <Spinner aria-label="로딩 중" />
                ) : (
                  <PreviewIcon size={16} />
                )}
                미리보기 ({selectedIds.size}개)
              </Button>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingBlock: 32,
              }}
            >
              <Spinner aria-label="로딩 중" />
            </div>
          ) : (
            <>
              <div>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2 border-b border-default"
                      >
                        <Checkbox
                          isSelected={
                            questions.length > 0 &&
                            selectedIds.size === questions.length
                          }
                          isIndeterminate={
                            selectedIds.size > 0 &&
                            selectedIds.size < questions.length
                          }
                          isDisabled={false}
                          onChange={handleSelectAll}
                          aria-label={"선택"}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 border-b border-default"
                      >
                        질문 (한국어)
                      </th>
                      <th
                        scope="col"
                        style={{ width: 100 }}
                        className="px-3 py-2 border-b border-default"
                      >
                        차원
                      </th>
                      <th
                        scope="col"
                        style={{ width: 100 }}
                        className="px-3 py-2 border-b border-default"
                      >
                        생성일
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-2 border-b border-default"
                        >
                          <p style={{ paddingBlock: 32 }}>
                            번역이 필요한 질문이 없습니다.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      questions.map((question) => (
                        <tr key={question.id}>
                          <td className="px-3 py-2 border-b border-default">
                            <Checkbox
                              isSelected={selectedIds.has(question.id)}
                              isIndeterminate={false}
                              isDisabled={false}
                              onChange={() => handleToggleSelect(question.id)}
                              aria-label={"선택"}
                            >
                              <Checkbox.Content>
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Content>
                            </Checkbox>
                          </td>
                          <td className="px-3 py-2 border-b border-default">
                            {question.text}
                          </td>
                          <td className="px-3 py-2 border-b border-default">
                            <Chip size="sm">
                              {DIMENSION_LABELS[question.dimension]}
                            </Chip>
                          </td>
                          <td className="px-3 py-2 border-b border-default">
                            {formatDate(question.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 24,
                  }}
                >
                  <nav aria-label="페이지" className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      isDisabled={page <= 1}
                      onPress={() =>
                        ((_, value) => setPage(value))(null, page - 1)
                      }
                    >
                      이전
                    </Button>
                    <span>
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      isDisabled={page >= totalPages}
                      onPress={() =>
                        ((_, value) => setPage(value))(null, page + 1)
                      }
                    >
                      다음
                    </Button>
                  </nav>
                </div>
              )}
            </>
          )}
        </>
      )}
      {step === "preview" && previewData && (
        <>
          <div style={{ padding: 16, marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p>
                  번역 예상:{" "}
                  <strong>
                    {Array.isArray(previewData.translations)
                      ? previewData.translations.length
                      : 0}
                    개
                  </strong>
                </p>
                <p>
                  예상 비용: $
                  {Number(previewData.metadata?.estimatedCost ?? 0).toFixed(4)}|
                  예상 시간: {previewData.metadata?.estimatedTimeMs ?? 0}ms
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  onClick={handleReset}
                  variant={"secondary"}
                  isDisabled={processing}
                >
                  다시 선택
                </Button>
                <Button
                  onClick={handleExecuteTranslation}
                  variant={"primary"}
                  isDisabled={processing}
                >
                  {processing ? (
                    <Spinner aria-label="로딩 중" />
                  ) : (
                    <TranslateIcon size={16} />
                  )}
                  번역 실행
                </Button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(Array.isArray(previewData.translations)
              ? previewData.translations
              : []
            ).map((item, index) => (
              <Card key={item.sourceId}>
                <Card.Content>
                  <p>#{index + 1}</p>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p>한국어 (원본)</p>
                      <p>{item.source.text}</p>
                      <p style={{ marginTop: 8 }}>
                        {(Array.isArray(item.source.options)
                          ? item.source.options
                          : []
                        ).join(" / ")}
                      </p>
                    </div>
                    <hr />
                    <div style={{ flex: 1 }}>
                      <p>일본어 (번역)</p>
                      <p>{item.translated.text}</p>
                      <p style={{ marginTop: 8 }}>
                        {(Array.isArray(item.translated.options)
                          ? item.translated.options
                          : []
                        ).join(" / ")}
                      </p>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        </>
      )}
      {step === "result" && resultData && (
        <div style={{ padding: 24, textAlign: "center" }}>
          <CheckCircleIcon size={16} />
          <h5>번역 {resultData.success ? "완료" : "부분 완료"}</h5>
          <p>
            성공: {resultData.translated}개 / 실패: {resultData.failed}개
          </p>
          <p>
            실제 비용: $
            {Number(resultData.metadata?.actualCost ?? 0).toFixed(4)}| 처리
            시간: {resultData.metadata?.processingTimeMs ?? 0}ms
          </p>
          {resultData.failed > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-default p-3 text-sm"
              style={{ marginTop: 16, textAlign: "left" }}
            >
              <p>실패한 항목:</p>
              {resultData.results
                .filter((r) => r.status === "failed")
                .map((r) => (
                  <p key={r.sourceId}>
                    - {r.sourceId}: {r.error}
                  </p>
                ))}
            </div>
          )}
          <Button
            onClick={handleReset}
            style={{ marginTop: 24 }}
            variant={"primary"}
          >
            처음으로
          </Button>
        </div>
      )}
    </div>
  );
}
