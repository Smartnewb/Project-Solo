"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import {
  Disclosure,
  Tabs,
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import {
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  ChevronDown as ExpandMoreIcon,
  ChevronDown as KeyboardArrowDownIcon,
  ChevronUp as KeyboardArrowUpIcon,
  Camera as PhotoCameraIcon,
} from "lucide-react";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  PixelCampusChoice,
  PixelCampusCut,
  PixelCampusEpisode,
  PixelCampusEpisodePayload,
} from "@/types/admin";
import {
  useCreatePixelCampusEpisode,
  usePixelCampusEpisodes,
  useUpdatePixelCampusEpisode,
  useUploadPixelCampusAsset,
} from "@/app/admin/hooks/use-pixel-campus";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { AXIS_OPTIONS, DIRECTION_LABELS } from "../constants";
import { EpisodePreview } from "./EpisodePreview";

const lockedStatuses = new Set(["scheduled", "published", "archived"]);
const MAX_CUTS = 5;
const MAX_CUT_TEXT_LENGTH = 300;

function emptyCut(speaker: PixelCampusCut["speaker"] = "miho"): PixelCampusCut {
  return { speaker, text: "" };
}

function createChoice(
  displayOrder: 1 | 2,
  choice?: PixelCampusChoice,
): PixelCampusChoice {
  return {
    label: choice?.label ?? "",
    displayOrder,
    axis: choice?.axis ?? "initiative",
    direction: choice?.direction ?? (displayOrder === 1 ? 1 : -1),
    weight: choice?.weight ?? 2,
    revealCopy: choice?.revealCopy ?? "",
  };
}

function initialCuts(episode?: PixelCampusEpisode | null): PixelCampusCut[] {
  if (episode?.cuts?.length) {
    return episode.cuts.slice(0, MAX_CUTS).map((cut) => ({
      speaker: cut.speaker,
      text: cut.text ?? "",
    }));
  }

  if (episode?.situationText) {
    return [{ speaker: "miho", text: episode.situationText }];
  }

  return [emptyCut("miho"), emptyCut("me"), emptyCut("miho")];
}

interface FormState {
  chapterNo: string;
  episodeNo: string;
  title: string;
  sceneImageUrl: string;
  cuts: PixelCampusCut[];
  choices: PixelCampusChoice[];
}

function initialState(episode?: PixelCampusEpisode | null): FormState {
  const sortedChoices = [...(episode?.choices ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return {
    chapterNo: episode?.chapterNo ? String(episode.chapterNo) : "",
    episodeNo: episode?.episodeNo ? String(episode.episodeNo) : "",
    title: episode?.title ?? "",
    sceneImageUrl: episode?.sceneImageUrl ?? "",
    cuts: initialCuts(episode),
    choices: [
      createChoice(1, sortedChoices[0]),
      createChoice(2, sortedChoices[1]),
    ],
  };
}

interface Props {
  episode?: PixelCampusEpisode | null;
  mode: "create" | "edit";
}

export function EpisodeForm({ episode, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(episode));
  const [error, setError] = useState<string | null>(null);
  const [autoNumberApplied, setAutoNumberApplied] = useState(false);
  const createEpisode = useCreatePixelCampusEpisode();
  const updateEpisode = useUpdatePixelCampusEpisode();
  const uploadAsset = useUploadPixelCampusAsset();
  const episodesQuery = usePixelCampusEpisodes(
    mode === "create" ? { status: "all", page: 1, limit: 100 } : {},
    mode === "create",
  );
  const isLocked =
    mode === "edit" && !!episode && lockedStatuses.has(episode.status);
  const isSaving = createEpisode.isPending || updateEpisode.isPending;

  useEffect(() => {
    if (
      mode !== "create" ||
      autoNumberApplied ||
      form.chapterNo ||
      form.episodeNo
    )
      return;

    const episodes = episodesQuery.data?.items;
    if (!episodes?.length) return;

    const latestEpisode = [...episodes].sort((a, b) => {
      if (b.chapterNo !== a.chapterNo) return b.chapterNo - a.chapterNo;
      return b.episodeNo - a.episodeNo;
    })[0];

    setForm((prev) => ({
      ...prev,
      chapterNo: prev.chapterNo || String(latestEpisode.chapterNo || 1),
      episodeNo: prev.episodeNo || String((latestEpisode.episodeNo || 0) + 1),
    }));
    setAutoNumberApplied(true);
  }, [
    autoNumberApplied,
    episodesQuery.data?.items,
    form.chapterNo,
    form.episodeNo,
    mode,
  ]);

  const payload = useMemo<PixelCampusEpisodePayload>(
    () => ({
      chapterNo: Number(form.chapterNo),
      episodeNo: Number(form.episodeNo),
      title: form.title.trim(),
      sceneImageUrl: form.sceneImageUrl.trim() || null,
      cuts: form.cuts
        .map((cut) => ({ speaker: cut.speaker, text: cut.text.trim() }))
        .filter((cut) => cut.text),
      choices: form.choices.map((choice, index) => ({
        ...choice,
        label: choice.label.trim(),
        displayOrder: index + 1,
        revealCopy: choice.revealCopy.trim(),
      })),
    }),
    [form],
  );

  const setField = (
    field: "chapterNo" | "episodeNo" | "title" | "sceneImageUrl",
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setCut = (index: number, value: Partial<PixelCampusCut>) => {
    setForm((prev) => ({
      ...prev,
      cuts: prev.cuts.map((cut, cutIndex) =>
        cutIndex === index ? { ...cut, ...value } : cut,
      ),
    }));
  };

  const addCut = () => {
    setForm((prev) => ({
      ...prev,
      cuts:
        prev.cuts.length >= MAX_CUTS ? prev.cuts : [...prev.cuts, emptyCut()],
    }));
  };

  const removeCut = (index: number) => {
    setForm((prev) => ({
      ...prev,
      cuts:
        prev.cuts.length <= 1
          ? prev.cuts
          : prev.cuts.filter((_, cutIndex) => cutIndex !== index),
    }));
  };

  const moveCut = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.cuts.length) return prev;

      const cuts = [...prev.cuts];
      [cuts[index], cuts[nextIndex]] = [cuts[nextIndex], cuts[index]];
      return { ...prev, cuts };
    });
  };

  const setChoice = (index: number, value: Partial<PixelCampusChoice>) => {
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, ...value } : choice,
      ),
    }));
  };

  const validate = (): string | null => {
    if (!payload.chapterNo || payload.chapterNo < 1)
      return "챕터 번호를 입력해주세요.";
    if (!payload.episodeNo || payload.episodeNo < 1)
      return "에피소드 번호를 입력해주세요.";
    if (!payload.title) return "제목을 입력해주세요.";
    if (payload.cuts.length < 1) return "컷 대사를 1개 이상 입력해주세요.";
    if (payload.cuts.length > MAX_CUTS)
      return "컷은 최대 5개까지 입력할 수 있습니다.";
    if (payload.cuts.some((cut) => cut.text.length > MAX_CUT_TEXT_LENGTH)) {
      return "컷 대사는 300자 이하로 입력해주세요.";
    }
    if (payload.choices.length !== 2) return "선택지는 2개여야 합니다.";
    if (payload.choices.some((choice) => !choice.label))
      return "두 선택지 라벨을 모두 입력해주세요.";
    if (payload.choices.some((choice) => !choice.revealCopy)) {
      return "두 선택지의 리빌 카피를 모두 입력해주세요.";
    }
    return null;
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      setError("JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.");
      return;
    }

    try {
      const result = await uploadAsset.mutateAsync(file);
      setField("sceneImageUrl", result.url);
    } catch (uploadError) {
      setError(
        getAdminErrorMessage(uploadError, "이미지 업로드에 실패했습니다."),
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      if (mode === "create") {
        await createEpisode.mutateAsync(payload);
      } else if (episode) {
        await updateEpisode.mutateAsync({ id: episode.id, payload });
      }
      router.push("/admin/pixel-campus");
    } catch (saveError) {
      setError(getAdminErrorMessage(saveError, "저장에 실패했습니다."));
    }
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        {isLocked && (
          <div
            role="alert"
            className="rounded-lg border border-default p-3 text-sm"
            style={{ marginBottom: 16 }}
          >
            예약, 게시중, 보관 상태의 에피소드는 수정할 수 없습니다. 상태 변경은
            별도 액션을 사용해주세요.
          </div>
        )}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: 24 }}>
            <h6 style={{ marginBottom: 16 }}>기본 정보</h6>
            <div style={{ display: "grid", gap: 16 }}>
              <TextField>
                <Label>{"챕터 번호"}</Label>
                <Input
                  type="number"
                  value={form.chapterNo}
                  onChange={(event) =>
                    setField("chapterNo", event.target.value)
                  }
                  {...{ min: 1 }}
                  disabled={isLocked}
                />
              </TextField>
              <TextField>
                <Label>{"에피소드 번호"}</Label>
                <Input
                  type="number"
                  value={form.episodeNo}
                  onChange={(event) =>
                    setField("episodeNo", event.target.value)
                  }
                  {...{ min: 1 }}
                  disabled={isLocked}
                />
                <FieldError>
                  {mode === "create"
                    ? "목록 기준 다음 회차를 자동 입력합니다."
                    : undefined}
                </FieldError>
              </TextField>
            </div>
            <TextField style={{ marginTop: 16 }}>
              <Label>{"제목"}</Label>
              <Input
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                disabled={isLocked}
              />
            </TextField>
          </div>
          <div style={{ padding: 24 }}>
            <h6 style={{ marginBottom: 16 }}>장면 이미지</h6>
            <div
              style={{
                width: "100%",
                maxWidth: 520,
                aspectRatio: "16 / 10",
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "#e4e4e7",
                backgroundColor: "#f4f4f5",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              {form.sceneImageUrl ? (
                <img
                  src={form.sceneImageUrl}
                  alt="장면 이미지"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                ></img>
              ) : (
                <p>장면 이미지 없음</p>
              )}
            </div>
            {!form.sceneImageUrl && (
              <p className="text-sm text-danger">
                게시하려면 장면 이미지가 필요합니다.
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <label className="button button--secondary cursor-pointer">
                {form.sceneImageUrl ? "이미지 변경" : "이미지 업로드"}
                <input
                  type="file"
                  disabled={isLocked || uploadAsset.isPending}
                  hidden
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                />
              </label>
              {form.sceneImageUrl && (
                <Button
                  onClick={() => setField("sceneImageUrl", "")}
                  variant={"secondary"}
                  isDisabled={isLocked}
                >
                  제거
                </Button>
              )}
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <h6>컷 대사</h6>
              <Button
                onClick={addCut}
                variant={"secondary"}
                isDisabled={isLocked || form.cuts.length >= MAX_CUTS}
              >
                {<AddIcon size={16} />}컷 추가
              </Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {form.cuts.map((cut, index) => (
                <div
                  key={index}
                  style={{ padding: 16, backgroundColor: "#f4f4f5" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <Tabs
                      selectedKey={cut.speaker}
                      onSelectionChange={(key) =>
                        key &&
                        setCut(index, {
                          speaker: key as PixelCampusCut["speaker"],
                        })
                      }
                    >
                      <Tabs.ListContainer>
                        <Tabs.List>
                          <Tabs.Tab id={"miho"}>
                            미호
                            <Tabs.Indicator />
                          </Tabs.Tab>
                          <Tabs.Tab id={"me"}>
                            나<Tabs.Indicator />
                          </Tabs.Tab>
                        </Tabs.List>
                      </Tabs.ListContainer>
                    </Tabs>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Button
                        onClick={() => moveCut(index, -1)}
                        variant={"secondary"}
                        isDisabled={isLocked || index === 0}
                      >
                        {<KeyboardArrowUpIcon size={16} />}위
                      </Button>
                      <Button
                        onClick={() => moveCut(index, 1)}
                        variant={"secondary"}
                        isDisabled={isLocked || index === form.cuts.length - 1}
                      >
                        {<KeyboardArrowDownIcon size={16} />}아래
                      </Button>
                      <Button
                        onClick={() => removeCut(index)}
                        variant={"secondary"}
                        isDisabled={isLocked || form.cuts.length <= 1}
                      >
                        {<DeleteIcon size={16} />}삭제
                      </Button>
                    </div>
                  </div>
                  <TextField>
                    <Label>{`컷 ${index + 1}`}</Label>
                    <TextArea
                      value={cut.text}
                      onChange={(event) =>
                        setCut(index, {
                          text: event.target.value.slice(
                            0,
                            MAX_CUT_TEXT_LENGTH,
                          ),
                        })
                      }
                      disabled={isLocked}
                    />
                    <FieldError>{`${cut.text.length}/${MAX_CUT_TEXT_LENGTH}`}</FieldError>
                  </TextField>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <h6 style={{ marginBottom: 16 }}>선택지</h6>
            <div style={{ display: "grid", gap: 16 }}>
              {form.choices.map((choice, index) => (
                <div
                  key={index}
                  style={{ padding: 16, backgroundColor: "#f4f4f5" }}
                >
                  <p style={{ marginBottom: 16 }}>선택지 {index + 1}</p>
                  <TextField style={{ marginBottom: 16 }}>
                    <Label>{"라벨"}</Label>
                    <Input
                      value={choice.label}
                      onChange={(event) =>
                        setChoice(index, { label: event.target.value })
                      }
                      disabled={isLocked}
                    />
                  </TextField>
                  <TextField>
                    <Label>{"리빌 카피"}</Label>
                    <TextArea
                      value={choice.revealCopy}
                      onChange={(event) =>
                        setChoice(index, { revealCopy: event.target.value })
                      }
                      disabled={isLocked}
                    />
                  </TextField>
                </div>
              ))}
            </div>
            <Disclosure>
              <Disclosure.Heading>
                <Disclosure.Trigger className="w-full py-3 text-left">
                  <p>고급 설정</p>
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {form.choices.map((choice, index) => {
                    const directionLabels = DIRECTION_LABELS[choice.axis];

                    return (
                      <div key={index} style={{ padding: 16 }}>
                        <p style={{ marginBottom: 16 }}>
                          선택지 {index + 1}점수
                        </p>
                        <div style={{ display: "grid", gap: 16 }}>
                          <div>
                            <Select
                              selectedKey={choice.axis || null}
                              onSelectionChange={(key) =>
                                ((event) =>
                                  setChoice(index, {
                                    axis: event.target
                                      .value as PixelCampusChoice["axis"],
                                  }))({ target: { value: key } } as any)
                              }
                              aria-label={"축"}
                            >
                              <HeroSelectLabel id={`axis-${index}`}>
                                축
                              </HeroSelectLabel>
                              <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  {AXIS_OPTIONS.map((axis) => (
                                    <ListBox.Item
                                      key={axis.value}
                                      id={axis.value}
                                      textValue={String(axis.label)}
                                    >
                                      {axis.label}
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          </div>
                          <div>
                            <Select
                              selectedKey={choice.direction || null}
                              onSelectionChange={(key) =>
                                ((event) =>
                                  setChoice(index, {
                                    direction: Number(event.target.value) as
                                      | -1
                                      | 1,
                                  }))({ target: { value: key } } as any)
                              }
                              aria-label={"방향"}
                            >
                              <HeroSelectLabel id={`direction-${index}`}>
                                방향
                              </HeroSelectLabel>
                              <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  <ListBox.Item
                                    id={1}
                                    textValue={
                                      "+" + String(directionLabels.positive)
                                    }
                                  >
                                    + {directionLabels.positive}
                                  </ListBox.Item>
                                  <ListBox.Item
                                    id={-1}
                                    textValue={
                                      "-" + String(directionLabels.negative)
                                    }
                                  >
                                    - {directionLabels.negative}
                                  </ListBox.Item>
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          </div>
                          <div>
                            <Select
                              selectedKey={choice.weight || null}
                              onSelectionChange={(key) =>
                                ((event) =>
                                  setChoice(index, {
                                    weight: Number(event.target.value) as
                                      | 1
                                      | 2
                                      | 3,
                                  }))({ target: { value: key } } as any)
                              }
                              aria-label={"가중치"}
                            >
                              <HeroSelectLabel id={`weight-${index}`}>
                                가중치
                              </HeroSelectLabel>
                              <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                              </Select.Trigger>
                              <Select.Popover>
                                <ListBox>
                                  {[1, 2, 3].map((weight) => (
                                    <ListBox.Item
                                      key={weight}
                                      id={weight}
                                      textValue={String(weight)}
                                    >
                                      {weight}
                                    </ListBox.Item>
                                  ))}
                                </ListBox>
                              </Select.Popover>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Disclosure.Content>
            </Disclosure>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
          }}
        >
          <Button
            onClick={() => router.push("/admin/pixel-campus")}
            variant={"secondary"}
            isDisabled={isSaving}
          >
            목록
          </Button>
          <Button
            onClick={handleSubmit}
            variant={"primary"}
            isDisabled={isLocked || isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
      <div>
        <p style={{ marginBottom: 8 }}>앱 미리보기</p>
        <EpisodePreview
          sceneImageUrl={form.sceneImageUrl}
          cuts={form.cuts}
          choices={form.choices}
        />
      </div>
    </div>
  );
}
