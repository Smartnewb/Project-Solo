"use client";
import { Button, Modal, Spinner } from "@heroui/react";
import { X as CloseIcon } from "lucide-react";

import { usePixelCampusEpisodeStats } from "@/app/admin/hooks/use-pixel-campus";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";

interface Props {
  episodeId: string | null;
  open: boolean;
  onClose: () => void;
}

export function EpisodeStatsDialog({ episodeId, open, onClose }: Props) {
  const statsQuery = usePixelCampusEpisodeStats(episodeId, open);

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Container>
        <Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }} className="max-w-3xl">
          <Modal.Heading style={{ paddingRight: 6 }}>
            선택지별 참여 통계
            <Button
              aria-label="닫기"
              onClick={onClose}
              style={{ position: "absolute", right: 12, top: 12 }}
              variant={"secondary"}
              isIconOnly
            >
              <CloseIcon size={16} />
            </Button>
          </Modal.Heading>
          <Modal.Body>
            {statsQuery.isLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 32,
                }}
              >
                <Spinner aria-label="로딩 중" />
              </div>
            ) : statsQuery.error ? (
              <div
                role="alert"
                className="rounded-lg border border-default p-3 text-sm"
              >
                {getAdminErrorMessage(
                  statsQuery.error,
                  "통계를 불러오지 못했습니다.",
                )}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 border-b border-default"
                    >
                      선택지
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 border-b border-default"
                    >
                      전체
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 border-b border-default"
                    >
                      남
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 border-b border-default"
                    >
                      여
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(statsQuery.data?.choices ?? []).map((choice) => (
                    <tr key={choice.choiceId}>
                      <td className="px-3 py-2 border-b border-default">
                        {choice.label}
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {choice.total}
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {choice.male}
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {choice.female}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
