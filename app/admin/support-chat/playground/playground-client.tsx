"use client";
import {
  Tabs,
  Button,
  Card,
  Chip,
  FieldError,
  Label,
  Spinner,
  TextArea,
  TextField,
  Tooltip,
} from "@heroui/react";
import {
  ChevronDown as ExpandMore,
  Send,
  Copy as ContentCopy,
} from "lucide-react";

import { useState, useCallback } from "react";

import {
  QA_CATEGORIES,
  LEVEL_META,
  type QaQuestion,
  type GradeLevel,
} from "./question-set";

interface Source {
  question: string;
  answer: string;
  similarity: number;
}
interface PlaygroundResult {
  answer: string;
  confidence: number;
  domain: string;
  sources: Source[];
}
interface RunRecord {
  question: string;
  language: "ko" | "ja";
  expected?: string;
  level?: GradeLevel;
  result: PlaygroundResult;
  ms: number;
}

function confidenceColor(c: number): string {
  if (c >= 0.7) return "#16a34a";
  if (c >= 0.5) return "#ca8a04";
  return "#dc2626";
}

export default function PlaygroundClient() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState<"ko" | "ja">("ko");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<RunRecord | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [presetMeta, setPresetMeta] = useState<{
    expected: string;
    level: GradeLevel;
  } | null>(null);

  const pickPreset = useCallback((q: QaQuestion) => {
    setQuestion(q.text);
    setPresetMeta({ expected: q.expected, level: q.level });
    setError(null);
  }, []);

  const run = useCallback(async () => {
    const msg = question.trim();
    if (!msg || loading) return;
    setLoading(true);
    setError(null);
    const startedAt = performance.now();
    try {
      const res = await fetch("/api/admin/cs-playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `요청 실패 (HTTP ${res.status})`);
        return;
      }
      const record: RunRecord = {
        question: msg,
        language,
        expected: presetMeta?.expected,
        level: presetMeta?.level,
        result: data as PlaygroundResult,
        ms: Math.round(performance.now() - startedAt),
      };
      setCurrent(record);
      setHistory((prev) => [record, ...prev].slice(0, 30));
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [question, language, loading, presetMeta]);

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
      <div>
        <h5>CS Playground</h5>
        <p>
          openclaw 답변을 세션 생성 없이 미리보기·검수합니다. 좌측 질문셋을
          누르면 입력칸에 채워지고 정답 기준이 함께 표시됩니다.
        </p>
      </div>
      <div style={{ flex: 1, display: "flex", gap: 16, overflow: "hidden" }}>
        {/* 좌측: 질문셋 카드 — 클릭 즉시 입력칸 채움 */}
        <div
          style={{ width: 400, flexShrink: 0, overflow: "auto", padding: 12 }}
        >
          <p style={{ paddingInline: 4, paddingBottom: 8 }}>
            실 유저 질문셋 (30) · 카드 클릭 → 입력
          </p>
          <div className="flex flex-col gap-3 min-w-0">
            {QA_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <p style={{ paddingInline: 4 }}>{cat.label}</p>
                <div className="flex flex-col gap-3 min-w-0">
                  {cat.questions.map((q) => {
                    const selected = question.trim() === q.text;
                    return (
                      <Card
                        key={q.id}
                        style={{
                          borderColor: "#e4e4e7",
                          borderLeft: `3px solid ${LEVEL_META[q.level].color}`,
                          backgroundColor: selected
                            ? "action.selected"
                            : "#ffffff",
                        }}
                      >
                        <Button
                          variant="secondary"
                          className="w-full h-auto justify-start p-3"
                          onClick={() => pickPreset(q)}
                        >
                          <div className="flex flex-row gap-3 min-w-0">
                            <Tooltip>
                              <Tooltip.Trigger>
                                <span
                                  style={{ fontSize: 14, lineHeight: "20px" }}
                                >
                                  {LEVEL_META[q.level].emoji}
                                </span>
                              </Tooltip.Trigger>
                              <Tooltip.Content>
                                {LEVEL_META[q.level].label}
                              </Tooltip.Content>
                            </Tooltip>
                            <p>{q.text}</p>
                          </div>
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* 우측: 입력 + 답변 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            overflow: "auto",
          }}
        >
          <div style={{ padding: 16 }}>
            <div className="flex flex-col gap-3 min-w-0">
              <div className="flex flex-row gap-3 min-w-0">
                <Tabs
                  selectedKey={language}
                  onSelectionChange={(key) =>
                    setLanguage(String(key) as "ko" | "ja")
                  }
                >
                  <Tabs.ListContainer>
                    <Tabs.List>
                      <Tabs.Tab id={"ko"}>
                        한국어 (KR)
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab id={"ja"}>
                        日本語 (JP)
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>
                </Tabs>
                {presetMeta && (
                  <Chip size="sm">{`${LEVEL_META[presetMeta.level].emoji} ${LEVEL_META[presetMeta.level].label}`}</Chip>
                )}
              </div>
              <TextField
                aria-label={"CS 질문을 입력하거나 좌측 질문셋을 선택하세요."}
              >
                <TextArea
                  rows={2}
                  placeholder="CS 질문을 입력하거나 좌측 질문셋을 선택하세요."
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    setPresetMeta(null);
                  }}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
                  }}
                  aria-label={"CS 질문을 입력하거나 좌측 질문셋을 선택하세요."}
                />
              </TextField>
              {presetMeta && (
                <div
                  role="alert"
                  className="rounded-lg border border-default p-3 text-sm"
                  style={{ paddingBlock: 0 }}
                >
                  <strong>정답 기준:</strong>
                  {presetMeta.expected}
                </div>
              )}
              <div>
                <Button
                  onClick={run}
                  variant={"primary"}
                  isDisabled={loading || !question.trim()}
                >
                  {loading ? <Spinner aria-label="로딩 중" /> : <Send />}
                  {loading
                    ? "답변 생성 중… (~20-30s)"
                    : "openclaw 답변 받기  (⌘/Ctrl+Enter)"}
                </Button>
              </div>
            </div>
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-default p-3 text-sm"
            >
              {error}
            </div>
          )}
          {current && <AnswerCard record={current} />}
          {history.length > 1 && (
            <div>
              <p style={{ marginBottom: 8 }}>
                이전 검수 ({history.length - 1})
              </p>
              <div className="flex flex-col gap-3 min-w-0">
                {history.slice(1).map((r, i) => (
                  <AnswerCard key={i} record={r} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnswerCard({
  record,
  compact,
}: {
  record: RunRecord;
  compact?: boolean;
}) {
  const { question, result, expected, level, ms, language } = record;
  const copyAnswer = () => {
    void navigator.clipboard?.writeText(result.answer);
  };
  return (
    <div style={{ padding: 16 }}>
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex flex-row gap-3 min-w-0">
          <Chip size="sm">{language.toUpperCase()}</Chip>
          <Chip size="sm">{`confidence ${result.confidence.toFixed(3)}`}</Chip>
          <Chip size="sm">{`domain: ${result.domain}`}</Chip>
          <Chip size="sm">{`${ms}ms`}</Chip>
          {result.confidence < 0.5 && (
            <Chip size="sm">{"에스컬레이션 (conf<0.5)"}</Chip>
          )}
        </div>

        <div>
          <p>질문</p>
          <p>{question}</p>
        </div>

        {expected && (
          <div
            role="alert"
            className="rounded-lg border border-default p-3 text-sm"
            style={{ paddingBlock: 0 }}
          >
            <strong>{level ? LEVEL_META[level].emoji : ""} 정답 기준:</strong>
            {expected}
          </div>
        )}

        <div>
          <div className="flex flex-row gap-3 min-w-0">
            <p>openclaw 답변</p>
            <Button onClick={copyAnswer} variant={"secondary"}>
              {<ContentCopy size={14} />}복사
            </Button>
          </div>
          <p
            style={{
              whiteSpace: "pre-wrap",
              backgroundColor: "#f4f4f5",
              padding: 12,
              borderRadius: 1,
            }}
          >
            {result.answer || "(빈 답변 — 생성 실패 또는 에스컬레이션)"}
          </p>
        </div>

        {!compact && result.sources?.length > 0 && (
          <details className="border-b border-default">
            <summary className="cursor-pointer py-2 font-semibold">
              <p>검색 근거 {result.sources.length}건 (similarity 순)</p>
            </summary>
            <div className="py-2">
              <div className="flex flex-col gap-3 min-w-0">
                {result.sources.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #e4e4e7",
                      borderColor: "#e4e4e7",
                      borderRadius: 1,
                      padding: 8,
                    }}
                  >
                    <div className="flex flex-row gap-3 min-w-0">
                      <Chip size="sm">{s.similarity.toFixed(3)}</Chip>
                      <p>{s.question}</p>
                    </div>
                    <hr style={{ marginBlock: 4 }} />
                    <p style={{ whiteSpace: "pre-wrap" }}>{s.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
