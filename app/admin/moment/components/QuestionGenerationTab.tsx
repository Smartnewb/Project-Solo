"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import {
  Button,
  Card,
  Checkbox,
  Chip,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Slider,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import {
  ChevronDown as ExpandMoreIcon,
  Trash2 as DeleteIcon,
  Pencil as EditIcon,
  Save as SaveIcon,
} from "lucide-react";

import { useState } from "react";

import AdminService from "@/app/services/admin";
import type {
  Big5Dimension,
  DimensionOrAuto,
  QuestionCandidate,
  DimensionDistribution,
  GenerateQuestionsResponse,
} from "@/types/moment";

const DIMENSION_LABELS: Record<Big5Dimension, string> = {
  openness: "개방성 (Openness)",
  conscientiousness: "성실성 (Conscientiousness)",
  extraversion: "외향성 (Extraversion)",
  agreeableness: "우호성 (Agreeableness)",
  neuroticism: "신경성 (Neuroticism)",
};

const DEFAULT_DISTRIBUTION: DimensionDistribution = {
  openness: 40,
  conscientiousness: 15,
  extraversion: 15,
  agreeableness: 15,
  neuroticism: 15,
};

export default function QuestionGenerationTab() {
  const [theme, setTheme] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [dimension, setDimension] = useState<DimensionOrAuto>("auto");
  const [count, setCount] = useState(10);
  const [useCustomDistribution, setUseCustomDistribution] = useState(false);
  const [distribution, setDistribution] =
    useState<DimensionDistribution>(DEFAULT_DISTRIBUTION);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<QuestionCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [metadata, setMetadata] = useState<
    GenerateQuestionsResponse["metadata"] | null
  >(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleAddKeyword = () => {
    const trimmed = keywordsInput.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 10) {
      setKeywords([...keywords, trimmed]);
      setKeywordsInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleDistributionChange = (dim: Big5Dimension, value: number) => {
    setDistribution((prev) => ({ ...prev, [dim]: value }));
  };

  const distributionSum = Object.values(distribution).reduce(
    (sum, val) => sum + (val || 0),
    0,
  );

  const handleGenerate = async () => {
    if (!theme.trim()) {
      setError("테마를 입력해주세요.");
      return;
    }
    if (keywords.length === 0) {
      setError("최소 1개의 키워드를 입력해주세요.");
      return;
    }
    if (
      dimension === "auto" &&
      useCustomDistribution &&
      distributionSum !== 100
    ) {
      setError("분배 비율의 합은 100이어야 합니다.");
      return;
    }

    setLoading(true);
    setError(null);
    setCandidates([]);
    setSelectedIds(new Set());
    setMetadata(null);

    try {
      const response = await AdminService.momentQuestions.generate({
        theme: theme.trim(),
        keywords,
        dimension,
        count,
        ...(dimension === "auto" && useCustomDistribution
          ? { distribution }
          : {}),
      });

      const normalizedCandidates = (
        Array.isArray(response.candidates) ? response.candidates : []
      ).map((candidate) => ({
        ...candidate,
        options: Array.isArray(candidate.options) ? candidate.options : [],
      }));
      setCandidates(normalizedCandidates);
      setMetadata(response.metadata);
      setSelectedIds(new Set(normalizedCandidates.map((c) => c.tempId)));
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "질문 생성에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (tempId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(tempId)) {
      newSelected.delete(tempId);
    } else {
      newSelected.add(tempId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.tempId)));
    }
  };

  const handleStartEdit = (candidate: QuestionCandidate) => {
    setEditingId(candidate.tempId);
    setEditText(candidate.text);
  };

  const handleSaveEdit = (tempId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, text: editText } : c)),
    );
    setEditingId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleRemoveCandidate = (tempId: string) => {
    setCandidates((prev) => prev.filter((c) => c.tempId !== tempId));
    const newSelected = new Set(selectedIds);
    newSelected.delete(tempId);
    setSelectedIds(newSelected);
  };

  const handleSaveQuestions = async () => {
    const selectedCandidates = candidates.filter((c) =>
      selectedIds.has(c.tempId),
    );
    if (selectedCandidates.length === 0) {
      setError("저장할 질문을 선택해주세요.");
      return;
    }

    setSaving(true);
    setSaveResult(null);
    setError(null);

    try {
      const response = await AdminService.momentQuestions.bulkCreate({
        questions: selectedCandidates.map((c) => ({
          text: c.text,
          dimension: c.dimension,
          type: "선택형",
          options: c.options,
        })),
        metadata: {
          theme,
          keywords,
        },
      });

      if (response.success) {
        setSaveResult({
          success: true,
          message: `${response.created}개 질문이 저장되었습니다.`,
        });
        setCandidates([]);
        setSelectedIds(new Set());
      } else {
        setSaveResult({
          success: false,
          message: `${response.created}개 저장 성공, ${response.failed}개 실패`,
        });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "질문 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ padding: 24, marginBottom: 24 }}>
        <h6>질문 생성 설정</h6>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TextField>
            <Label>{"테마"}</Label>
            <Input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="예: 대학생활, 취업준비, 인간관계"
            />
          </TextField>
          <div>
            <TextField style={{ width: 300, marginRight: 8 }}>
              <Label>{"키워드 추가"}</Label>
              <Input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="키워드 입력 후 Enter"
              />
            </TextField>
            <Button
              onClick={handleAddKeyword}
              variant={"secondary"}
              isDisabled={keywords.length >= 10}
            >
              추가
            </Button>
            <div style={{ marginTop: 8 }}>
              {keywords.map((kw) => (
                <Chip key={kw} size="sm">
                  {kw}
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    aria-label="키워드 제거"
                    onPress={() => handleRemoveKeyword(kw)}
                  >
                    ×
                  </Button>
                </Chip>
              ))}
              {keywords.length === 0 && (
                <p>키워드를 추가해주세요 (최대 10개)</p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ minWidth: 200 }}>
              <Select
                selectedKey={dimension || null}
                onSelectionChange={(key) =>
                  ((e) => setDimension(e.target.value as DimensionOrAuto))({
                    target: { value: key },
                  } as any)
                }
                aria-label={"차원"}
              >
                <HeroSelectLabel>차원</HeroSelectLabel>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id={"auto"} textValue={"자동 분배"}>
                      자동 분배
                    </ListBox.Item>
                    <ListBox.Item
                      id={"openness"}
                      textValue={"개방성 (Openness)"}
                    >
                      개방성 (Openness)
                    </ListBox.Item>
                    <ListBox.Item
                      id={"conscientiousness"}
                      textValue={"성실성 (Conscientiousness)"}
                    >
                      성실성 (Conscientiousness)
                    </ListBox.Item>
                    <ListBox.Item
                      id={"extraversion"}
                      textValue={"외향성 (Extraversion)"}
                    >
                      외향성 (Extraversion)
                    </ListBox.Item>
                    <ListBox.Item
                      id={"agreeableness"}
                      textValue={"우호성 (Agreeableness)"}
                    >
                      우호성 (Agreeableness)
                    </ListBox.Item>
                    <ListBox.Item
                      id={"neuroticism"}
                      textValue={"신경성 (Neuroticism)"}
                    >
                      신경성 (Neuroticism)
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <TextField style={{ width: 120 }}>
              <Label>{"생성 개수"}</Label>
              <Input
                type="number"
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.min(50, Math.max(1, parseInt(e.target.value) || 1)),
                  )
                }
                {...{ min: 1, max: 50 }}
              />
            </TextField>
          </div>
          {dimension === "auto" && (
            <div className="border-b border-default">
              <div className="py-2 font-semibold">
                <Checkbox
                  isSelected={useCustomDistribution}
                  isIndeterminate={false}
                  isDisabled={false}
                  onChange={(selected) =>
                    ((e) => setUseCustomDistribution(e.target.checked))({
                      target: { checked: selected },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  aria-label={"선택"}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label>{"커스텀 비율 설정"}</Label>
                  </Checkbox.Content>
                </Checkbox>
              </div>
              <div className="py-2" hidden={!useCustomDistribution}>
                <p style={{ marginBottom: 16 }}>
                  각 차원별 비율을 설정하세요. 합계: {distributionSum}%{" "}
                  {distributionSum !== 100 && "(100%가 되어야 합니다)"}
                </p>
                {(Object.keys(DIMENSION_LABELS) as Big5Dimension[]).map(
                  (dim) => (
                    <div key={dim} style={{ marginBottom: 16 }}>
                      <p>
                        {DIMENSION_LABELS[dim]}: {distribution[dim] || 0}%
                      </p>
                      <Slider
                        value={distribution[dim] || 0}
                        minValue={0}
                        maxValue={100}
                        onChange={(value) =>
                          ((_, value) =>
                            handleDistributionChange(dim, value as number))(
                            null,
                            value,
                          )
                        }
                        aria-label={DIMENSION_LABELS[dim]}
                      >
                        <Slider.Output />
                        <Slider.Track>
                          <Slider.Fill />
                          <Slider.Thumb />
                        </Slider.Track>
                      </Slider>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
          <Button
            onClick={handleGenerate}
            style={{ alignSelf: "flex-start" }}
            variant={"primary"}
            isDisabled={loading || !theme.trim() || keywords.length === 0}
          >
            {loading ? <Spinner aria-label="로딩 중" /> : "질문 생성하기"}
          </Button>
        </div>
      </div>
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
      {saveResult && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {saveResult.message}
          <Button
            variant="secondary"
            aria-label="알림 닫기"
            onClick={() => setSaveResult(null)}
          >
            닫기
          </Button>
        </div>
      )}
      {metadata && (
        <div style={{ padding: 16, marginBottom: 24 }}>
          <p>
            모델: {metadata.model}| 토큰: {metadata.outputTokens ?? 0}| 비용: $
            {Number(metadata.cost ?? 0).toFixed(4)}| 시간:{" "}
            {metadata.processingTimeMs ?? 0}ms
          </p>
        </div>
      )}
      {candidates.length > 0 && (
        <div style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h6>
              생성된 질문 ({selectedIds.size}/{candidates.length}개 선택)
            </h6>
            <div>
              <Button
                onClick={handleSelectAll}
                style={{ marginRight: 8 }}
                variant={"secondary"}
              >
                {selectedIds.size === candidates.length
                  ? "전체 해제"
                  : "전체 선택"}
              </Button>
              <Button
                onClick={handleSaveQuestions}
                variant={"primary"}
                isDisabled={saving || selectedIds.size === 0}
              >
                {saving ? (
                  <Spinner aria-label="로딩 중" />
                ) : (
                  <SaveIcon size={16} />
                )}
                선택한 질문 저장 ({selectedIds.size}개)
              </Button>
            </div>
          </div>
          <hr style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {candidates.map((candidate) => (
              <Card
                key={candidate.tempId}
                style={{
                  opacity: selectedIds.has(candidate.tempId) ? 1 : 0.6,
                  borderColor: "#e4e4e7",
                }}
              >
                <Card.Content>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <Checkbox
                      isSelected={selectedIds.has(candidate.tempId)}
                      isIndeterminate={false}
                      isDisabled={false}
                      onChange={() => handleToggleSelect(candidate.tempId)}
                      aria-label={"선택"}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Chip size="sm">
                          {DIMENSION_LABELS[candidate.dimension]}
                        </Chip>
                      </div>
                      {editingId === candidate.tempId ? (
                        <TextField aria-label={"입력"}>
                          <TextArea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            aria-label={"입력"}
                          />
                        </TextField>
                      ) : (
                        <p>{candidate.text}</p>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <p>
                          선택지:{" "}
                          {(Array.isArray(candidate.options)
                            ? candidate.options
                            : []
                          )
                            .map((o) => o.text)
                            .join(" / ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card.Content>
                <div className="flex justify-end gap-2 p-3">
                  {editingId === candidate.tempId ? (
                    <>
                      <Button onClick={handleCancelEdit} variant={"secondary"}>
                        취소
                      </Button>
                      <Button
                        onClick={() => handleSaveEdit(candidate.tempId)}
                        variant={"secondary"}
                      >
                        저장
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleStartEdit(candidate)}
                        variant={"secondary"}
                        isIconOnly
                        aria-label="작업"
                      >
                        <EditIcon size={16} />
                      </Button>
                      <Button
                        onClick={() => handleRemoveCandidate(candidate.tempId)}
                        variant={"secondary"}
                        isIconOnly
                        aria-label="작업"
                      >
                        <DeleteIcon size={16} />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
