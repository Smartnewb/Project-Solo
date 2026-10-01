"use client";
import { Button as HeroActionButton } from "@heroui/react";
import { Button, Spinner, Tooltip } from "@heroui/react";
import {
  ChartColumn as BarChartIcon,
  Pencil as EditIcon,
  Eye as VisibilityIcon,
} from "lucide-react";

import { useRouter } from "next/navigation";

import type { PixelCampusEpisodeStatus } from "@/types/admin";
import { usePixelCampusEpisodes } from "@/app/admin/hooks/use-pixel-campus";
import { getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { formatDateTime } from "../constants";
import { PixelCampusStatusBadge } from "./PixelCampusStatusBadge";

interface Props {
  status: PixelCampusEpisodeStatus | "all";
  onStatsClick: (episodeId: string) => void;
}

export function EpisodeListTab({ status, onStatsClick }: Props) {
  const router = useRouter();
  const episodesQuery = usePixelCampusEpisodes({ status, page: 1, limit: 50 });

  if (episodesQuery.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spinner aria-label="로딩 중" />
      </div>
    );
  }

  if (episodesQuery.error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-default p-3 text-sm"
      >
        {getAdminErrorMessage(
          episodesQuery.error,
          "에피소드 목록을 불러오지 못했습니다.",
        )}
      </div>
    );
  }

  const episodes = episodesQuery.data?.items ?? [];

  if (!episodes.length) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p>표시할 에피소드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <table className="w-full text-sm text-left">
        <thead>
          <tr>
            <th scope="col" className="px-3 py-2 border-b border-default">
              챕터-화
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              제목
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              상태
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              공개일
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              참여수
            </th>
            <th scope="col" className="px-3 py-2 border-b border-default">
              액션
            </th>
          </tr>
        </thead>
        <tbody>
          {episodes.map((episode) => (
            <tr key={episode.id} style={{ cursor: "pointer" }}>
              <td className="px-3 py-2 border-b border-default">
                <HeroActionButton
                  variant="ghost"
                  className="h-auto justify-start whitespace-normal p-0"
                  onClick={() =>
                    router.push(`/admin/pixel-campus/edit/${episode.id}`)
                  }
                >
                  {episode.chapterNo}-{episode.episodeNo}
                </HeroActionButton>
              </td>
              <td className="px-3 py-2 border-b border-default">
                <p>{episode.title}</p>
              </td>
              <td className="px-3 py-2 border-b border-default">
                <PixelCampusStatusBadge status={episode.status} />
              </td>
              <td className="px-3 py-2 border-b border-default">
                {formatDateTime(episode.publishAt)}
              </td>
              <td className="px-3 py-2 border-b border-default">
                {episode.answerCount ?? 0}
              </td>
              <td className="px-3 py-2 border-b border-default">
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/admin/pixel-campus/edit/${episode.id}`);
                      }}
                      variant={"secondary"}
                      isIconOnly
                      aria-label="작업"
                    >
                      <VisibilityIcon size={16} />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>{"상세"}</Tooltip.Content>
                </Tooltip>
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/admin/pixel-campus/edit/${episode.id}`);
                      }}
                      variant={"secondary"}
                      isIconOnly
                      aria-label="작업"
                    >
                      <EditIcon size={16} />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>{"편집"}</Tooltip.Content>
                </Tooltip>
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        onStatsClick(episode.id);
                      }}
                      variant={"secondary"}
                      isIconOnly
                      aria-label="작업"
                    >
                      <BarChartIcon size={16} />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>{"통계"}</Tooltip.Content>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
