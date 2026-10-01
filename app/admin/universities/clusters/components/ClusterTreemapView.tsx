"use client";
import { Button as HeroActionButton } from "@heroui/react";


import { useMemo, useState } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

import type { AdminClusterItem } from "@/types/admin";
import { CLUSTER_GEO } from "../constants";

interface ClusterTreemapViewProps {
  clusters: AdminClusterItem[];
  country: "KR" | "JP";
}

interface TreemapNode {
  name: string;
  size?: number;
  color?: string;
  clusterId?: string;
  universityId?: string;
  children?: TreemapNode[];
}

export default function ClusterTreemapView({
  clusters,
  country,
}: ClusterTreemapViewProps) {
  const [selectedCluster, setSelectedCluster] =
    useState<AdminClusterItem | null>(null);
  const geoMap = CLUSTER_GEO[country] || {};

  const treemapData = useMemo(() => {
    const children: TreemapNode[] = clusters.map((cluster) => {
      const color = geoMap[cluster.id]?.color || "#94A3B8";
      return {
        name: cluster.name,
        clusterId: cluster.id,
        color,
        children: cluster.universities.map((univ) => ({
          name: univ.name,
          size: Math.max(univ.userCount, 1),
          color,
          clusterId: cluster.id,
          universityId: univ.id,
        })),
      };
    });

    return children;
  }, [clusters, geoMap]);

  const totalUsers = useMemo(
    () => clusters.reduce((sum, c) => sum + c.userCount, 0),
    [clusters],
  );

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, color, depth, clusterId } = props;

    if (width < 2 || height < 2) return null;

    const showLabel = width > 40 && height > 25;
    const showCount = width > 60 && height > 40;

    // depth 1 = cluster group, depth 2 = individual university
    if (depth === 1) {
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            style={{
              fill: color,
              opacity: 0.15,
              stroke: color,
              strokeWidth: 2,
              cursor: "pointer",
            }}
            onClick={() => {
              const cluster = clusters.find((c) => c.id === clusterId);
              setSelectedCluster(cluster || null);
            }}
          />
        </g>
      );
    }

    const univ = clusters
      .flatMap((c) => c.universities.map((u) => ({ ...u, clusterId: c.id })))
      .find((u) => u.id === props.universityId);

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            opacity:
              selectedCluster && selectedCluster.id !== clusterId ? 0.2 : 0.7,
            stroke: "#fff",
            strokeWidth: 1,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onClick={() => {
            const cluster = clusters.find((c) => c.id === clusterId);
            setSelectedCluster(cluster || null);
          }}
        />
        {showLabel && (
          <text
            x={x + width / 2}
            y={y + height / 2 - (showCount ? 6 : 0)}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: Math.min(12, width / 6),
              fill: "#fff",
              fontWeight: 600,
              pointerEvents: "none",
            }}
          >
            {name.length > width / 8
              ? name.slice(0, Math.floor(width / 8)) + "…"
              : name}
          </text>
        )}
        {showCount && univ && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: Math.min(10, width / 8),
              fill: "rgba(255,255,255,0.8)",
              pointerEvents: "none",
            }}
          >
            {univ.userCount.toLocaleString()}명
          </text>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    if (!data.universityId) return null;

    const cluster = clusters.find((c) => c.id === data.clusterId);

    return (
      <div style={{ padding: 12, maxWidth: 220 }}>
        <p>{data.name}</p>
        <p>
          {cluster?.name}· {data.size?.toLocaleString()}명
        </p>
      </div>
    );
  };

  return (
    <div>
      {/* 트리맵 */}
      <div style={{ padding: 16, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <p>
            총 {totalUsers.toLocaleString()}명 · {clusters.length}개 클러스터
          </p>
          {selectedCluster && (
            <HeroActionButton
              variant="ghost"
              className="h-auto w-full justify-start whitespace-normal text-left"
              style={{ cursor: "pointer", color: "#52525b" }}
              onClick={() => setSelectedCluster(null)}
            >
              전체 보기
            </HeroActionButton>
          )}
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
        {/* 클러스터 범례 */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 16,
            justifyContent: "center",
          }}
        >
          {clusters.map((cluster) => {
            const color = geoMap[cluster.id]?.color || "#94A3B8";
            const isActive =
              !selectedCluster || selectedCluster.id === cluster.id;
            return (
              <HeroActionButton
                variant="ghost"
                className="h-auto w-full justify-start whitespace-normal text-left"
                key={cluster.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  opacity: isActive ? 1 : 0.4,
                  transition: "opacity 0.2s",
                }}
                onClick={() =>
                  setSelectedCluster(
                    selectedCluster?.id === cluster.id ? null : cluster,
                  )
                }
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "2px",
                    backgroundColor: color,
                  }}
                ></div>
                <p>
                  {cluster.name}({cluster.userCount.toLocaleString()})
                </p>
              </HeroActionButton>
            );
          })}
        </div>
      </div>
      {/* 선택된 클러스터 상세 테이블 */}
      {selectedCluster && (
        <div style={{ padding: 16 }}>
          <p style={{ marginBottom: 12 }}>
            {selectedCluster.name}— 대학별 유저 현황
          </p>
          <div style={{ maxHeight: 400 }}>
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th
                    scope="col"
                    style={{ fontWeight: 600 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    #
                  </th>
                  <th
                    scope="col"
                    style={{ fontWeight: 600 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    대학명
                  </th>
                  <th
                    scope="col"
                    style={{ fontWeight: 600 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    지역
                  </th>
                  <th
                    scope="col"
                    style={{ fontWeight: 600 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    유저수
                  </th>
                  <th
                    scope="col"
                    style={{ fontWeight: 600 }}
                    className="px-3 py-2 border-b border-default"
                  >
                    비율
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...selectedCluster.universities]
                  .sort((a, b) => b.userCount - a.userCount)
                  .map((univ, idx) => (
                    <tr key={univ.id}>
                      <td className="px-3 py-2 border-b border-default">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {univ.name}
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {univ.region}
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {univ.userCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 border-b border-default">
                        {selectedCluster.userCount > 0
                          ? (
                              (univ.userCount / selectedCluster.userCount) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
