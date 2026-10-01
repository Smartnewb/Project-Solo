"use client";
import { EpisodeForm } from "../components/EpisodeForm";

export default function PixelCampusCreatePage() {
  return (
    <div style={{ padding: 24 }}>
      <h5 style={{ marginBottom: 16 }}>픽셀 캠퍼스 에피소드 작성</h5>
      <EpisodeForm mode="create" />
    </div>
  );
}
