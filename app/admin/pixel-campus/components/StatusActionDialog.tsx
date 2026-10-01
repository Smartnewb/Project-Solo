"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
} from "@heroui/react";

import { useEffect, useMemo, useState } from "react";

import type {
  PixelCampusEpisode,
  PixelCampusEpisodeStatus,
} from "@/types/admin";
import { useUpdatePixelCampusStatus } from "@/app/admin/hooks/use-pixel-campus";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import {
  fromDateTimeLocal,
  nextNinePmLocal,
  STATUS_LABELS,
} from "../constants";
import { EpisodePreview } from "./EpisodePreview";

const TRANSITIONS: Record<
  PixelCampusEpisodeStatus,
  PixelCampusEpisodeStatus[]
> = {
  draft: ["in_review"],
  in_review: ["draft", "scheduled", "published"],
  scheduled: ["draft", "published"],
  published: ["archived"],
  archived: [],
};

function transitionLabel(status: PixelCampusEpisodeStatus) {
  if (status === "draft") return "반려";
  return STATUS_LABELS[status] ?? status;
}

interface Props {
  open: boolean;
  episode: PixelCampusEpisode | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StatusActionDialog({
  open,
  episode,
  onClose,
  onSuccess,
}: Props) {
  const allowedStatuses = useMemo(
    () => (episode ? TRANSITIONS[episode.status] : []),
    [episode],
  );
  const [nextStatus, setNextStatus] = useState<PixelCampusEpisodeStatus | "">(
    "",
  );
  const [publishAt, setPublishAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdatePixelCampusStatus();

  useEffect(() => {
    if (open && episode) {
      const defaultStatus = allowedStatuses[0] ?? "";
      setNextStatus(defaultStatus);
      setPublishAt(defaultStatus === "scheduled" ? nextNinePmLocal() : "");
      setError(null);
    }
  }, [allowedStatuses, episode, open]);

  const handleStatusChange = (status: PixelCampusEpisodeStatus) => {
    setNextStatus(status);
    if (status === "scheduled" && !publishAt) {
      setPublishAt(nextNinePmLocal());
    }
  };

  const handleConfirm = async () => {
    if (!episode || !nextStatus) return;
    if (nextStatus === "scheduled" && !publishAt) {
      setError("예약 발행 시각을 입력해주세요.");
      return;
    }

    setError(null);
    try {
      await updateStatus.mutateAsync({
        id: episode.id,
        payload: {
          status: nextStatus,
          publishAt:
            nextStatus === "scheduled"
              ? fromDateTimeLocal(publishAt)
              : undefined,
        },
      });
      onSuccess?.();
      onClose();
    } catch (statusError) {
      setError(getAdminErrorMessage(statusError, "상태 변경에 실패했습니다."));
    }
  };

  return (
    <Modal.Backdrop
      isOpen={open && !!episode}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog style={{ width: '100%', maxWidth: 900, minWidth: 0 }} className="max-w-3xl">
          <Modal.Heading>상태 변경</Modal.Heading>
          <Modal.Body>
            {episode && (
              <div style={{ display: "grid", gap: 24 }}>
                <div>
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
                  <p style={{ marginBottom: 16 }}>
                    현재 상태는 {STATUS_LABELS[episode.status]}입니다.
                  </p>
                  {allowedStatuses.length ? (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Select
                          selectedKey={nextStatus || null}
                          onSelectionChange={(key) =>
                            ((event) =>
                              handleStatusChange(
                                event.target.value as PixelCampusEpisodeStatus,
                              ))({ target: { value: key } } as any)
                          }
                          aria-label={"다음 상태"}
                        >
                          <HeroSelectLabel id="pixel-campus-next-status">
                            다음 상태
                          </HeroSelectLabel>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {allowedStatuses.map((status) => (
                                <ListBox.Item
                                  key={status}
                                  id={status}
                                  textValue={String(transitionLabel(status))}
                                >
                                  {transitionLabel(status)}
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>

                      {nextStatus === "scheduled" && (
                        <TextField>
                          <Label>{"예약 발행 시각"}</Label>
                          <Input
                            type="datetime-local"
                            value={publishAt}
                            onChange={(event) =>
                              setPublishAt(event.target.value)
                            }
                          />
                          <FieldError>
                            {"기본값은 다음 21:00입니다."}
                          </FieldError>
                        </TextField>
                      )}
                    </>
                  ) : (
                    <div
                      role="alert"
                      className="rounded-lg border border-default p-3 text-sm"
                    >
                      현재 상태에서 가능한 전환이 없습니다.
                    </div>
                  )}
                </div>
                <EpisodePreview
                  sceneImageUrl={episode.sceneImageUrl}
                  cuts={
                    episode.cuts?.length
                      ? episode.cuts
                      : [{ speaker: "miho", text: episode.situationText }]
                  }
                  choices={episode.choices}
                />
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={onClose}
              variant={"secondary"}
              isDisabled={updateStatus.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirm}
              variant={"primary"}
              isDisabled={!nextStatus || updateStatus.isPending}
            >
              {updateStatus.isPending ? "변경 중..." : "변경"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
