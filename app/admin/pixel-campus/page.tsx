"use client";
import { Button, Spinner, Tabs } from "@heroui/react";
import { Plus as AddIcon } from "lucide-react";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { PixelCampusEpisodeStatus } from "@/types/admin";
import { STATUS_TABS } from "./constants";
import { EpisodeListTab } from "./components/EpisodeListTab";
import { EpisodeStatsDialog } from "./components/EpisodeStatsDialog";

type TabValue = PixelCampusEpisodeStatus | "all";

function PixelCampusPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = ((searchParams.get("status") as TabValue) ||
    "all") as TabValue;
  const [statsEpisodeId, setStatsEpisodeId] = useState<string | null>(null);

  const setTab = (tab: TabValue) => {
    router.replace(`/admin/pixel-campus?status=${tab}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h5>픽셀 캠퍼스</h5>
        <Button
          onClick={() => router.push("/admin/pixel-campus/create")}
          variant={"primary"}
        >
          {<AddIcon size={16} />}새 에피소드
        </Button>
      </div>
      <Tabs
        selectedKey={currentTab}
        onSelectionChange={(key) =>
          ((_, value) => setTab(value))(null, String(key) as any)
        }
        style={{ marginBottom: 16 }}
      >
        <Tabs.ListContainer>
          <Tabs.List>
            {STATUS_TABS.map((tab) => (
              <Tabs.Tab key={tab.value} id={tab.value}>
                {tab.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <EpisodeListTab status={currentTab} onStatsClick={setStatsEpisodeId} />
      <EpisodeStatsDialog
        episodeId={statsEpisodeId}
        open={!!statsEpisodeId}
        onClose={() => setStatsEpisodeId(null)}
      />
    </div>
  );
}

export default function PixelCampusPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <Spinner aria-label="로딩 중" />
        </div>
      }
    >
      <PixelCampusPageInner />
    </Suspense>
  );
}
