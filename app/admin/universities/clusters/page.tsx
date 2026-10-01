"use client";
import { Button, Spinner } from "@heroui/react";
import { Map as MapIcon, LayoutGrid as GridViewIcon } from "lucide-react";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

import { useCountry } from "@/contexts/CountryContext";
import AdminService from "@/app/services/admin";
import type { AdminClusterItem } from "@/types/admin";
import ClusterTreemapView from "./components/ClusterTreemapView";

const ClusterMapView = dynamic(() => import("./components/ClusterMapView"), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />,
});

function MapLoadingPlaceholder() {
  return (
    <div
      style={{
        height: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F5F9",
        borderRadius: "12px",
      }}
    >
      <Spinner aria-label="로딩 중" />
    </div>
  );
}

type ViewMode = "map" | "treemap";

function UniversityClustersPageContent() {
  const { country } = useCountry();
  const [clusters, setClusters] = useState<AdminClusterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  useEffect(() => {
    loadClusters();
  }, [country]);

  const loadClusters = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await AdminService.universities.getClusters();
      setClusters(data ?? []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "클러스터 데이터를 불러오는데 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = clusters.reduce((sum, c) => sum + c.userCount, 0);
  const totalUniversities = clusters.reduce(
    (sum, c) => sum + c.universities.length,
    0,
  );

  return (
    <div>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h5 className="text-lg font-semibold text-foreground">
            대학 클러스터 현황
          </h5>
          <p style={{ marginTop: 4 }}>클러스터별 소속 대학 및 활성 유저 분포</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "map" ? "primary" : "secondary"}
            onPress={() => setViewMode("map")}
          >
            <MapIcon size={16} />
            지도
          </Button>
          <Button
            variant={viewMode === "treemap" ? "primary" : "secondary"}
            onPress={() => setViewMode("treemap")}
          >
            <GridViewIcon size={16} />
            트리맵
          </Button>
        </div>
      </div>
      {/* 요약 카드 */}
      {!loading && !error && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <SummaryCard
            label="총 활성 유저"
            value={totalUsers.toLocaleString()}
            unit="명"
          />
          <SummaryCard
            label="클러스터"
            value={clusters.length.toString()}
            unit="개"
          />
          <SummaryCard
            label="등록 대학"
            value={totalUniversities.toLocaleString()}
            unit="개"
          />
          <SummaryCard
            label="최대 클러스터"
            value={
              clusters.length > 0
                ? [...clusters].sort((a, b) => b.userCount - a.userCount)[0]
                    .name
                : "-"
            }
          />
        </div>
      )}
      {/* 에러 */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-default p-3 text-sm"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}
      {/* 로딩 */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBlock: 96,
          }}
        >
          <Spinner aria-label="로딩 중" />
        </div>
      ) : clusters.length === 0 ? (
        <div style={{ textAlign: "center", paddingBlock: 64 }}>
          <p>클러스터 데이터가 없습니다.</p>
        </div>
      ) : (
        <>
          {viewMode === "map" ? (
            <ClusterMapView
              clusters={clusters}
              country={country.toUpperCase() as "KR" | "JP"}
            />
          ) : (
            <ClusterTreemapView
              clusters={clusters}
              country={country.toUpperCase() as "KR" | "JP"}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function UniversityClustersPage() {
  return <UniversityClustersPageContent />;
}

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div style={{ paddingInline: 24, paddingBlock: 16, minWidth: 140 }}>
      <p>{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <h6 className="text-lg font-semibold text-foreground">{value}</h6>
        {unit && <p>{unit}</p>}
      </div>
    </div>
  );
}
