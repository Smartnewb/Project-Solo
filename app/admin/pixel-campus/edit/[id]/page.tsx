"use client";
import { Button, Spinner } from "@heroui/react";
import { ArrowLeftRight as SyncAltIcon } from "lucide-react";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { usePixelCampusEpisode } from "@/app/admin/hooks/use-pixel-campus";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { EpisodeForm } from "../../components/EpisodeForm";
import { PixelCampusStatusBadge } from "../../components/PixelCampusStatusBadge";
import { StatusActionDialog } from "../../components/StatusActionDialog";

export default function PixelCampusEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const episodeId = params.id;
  const episodeQuery = usePixelCampusEpisode(episodeId);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  if (episodeQuery.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spinner aria-label="로딩 중" />
      </div>
    );
  }

  if (episodeQuery.error) {
    return (
      <div style={{ padding: 24 }}>
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {getAdminErrorMessage(
            episodeQuery.error,
            "에피소드를 불러오지 못했습니다.",
          )}
        </div>
        <Button
          onClick={() => router.push("/admin/pixel-campus")}
          variant={"secondary"}
        >
          목록으로
        </Button>
      </div>
    );
  }

  const episode = episodeQuery.data;

  if (!episode) {
    return (
      <div style={{ padding: 24 }}>
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
        >
          에피소드를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 16,
        }}
      >
        <div>
          <h5 style={{ marginBottom: 8 }}>픽셀 캠퍼스 에피소드 편집</h5>
          <PixelCampusStatusBadge status={episode.status} />
        </div>
        <Button onClick={() => setStatusDialogOpen(true)} variant={"secondary"}>
          {<SyncAltIcon size={16} />}상태 변경
        </Button>
      </div>
      <EpisodeForm key={episode.id} mode="edit" episode={episode} />
      <StatusActionDialog
        open={statusDialogOpen}
        episode={episode}
        onClose={() => setStatusDialogOpen(false)}
        onSuccess={() => episodeQuery.refetch()}
      />
    </div>
  );
}
