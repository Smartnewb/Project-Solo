"use client";
import { Chip } from "@heroui/react";

import type { PixelCampusEpisodeStatus } from "@/types/admin";
import { STATUS_LABELS } from "../constants";

const STATUS_COLORS: Record<
  PixelCampusEpisodeStatus,
  "default" | "warning" | "info" | "success"
> = {
  draft: "default",
  in_review: "warning",
  scheduled: "info",
  published: "success",
  archived: "default",
};

interface Props {
  status: PixelCampusEpisodeStatus;
}

export function PixelCampusStatusBadge({ status }: Props) {
  return <Chip size="sm">{STATUS_LABELS[status] ?? status}</Chip>;
}
