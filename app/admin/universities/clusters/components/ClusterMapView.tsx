"use client";
import { Chip } from "@heroui/react";
import { X as CloseIcon } from "lucide-react";

import { useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { AdminClusterItem } from "@/types/admin";
import { CLUSTER_GEO, MAP_CENTER } from "../constants";

interface ClusterMapViewProps {
  clusters: AdminClusterItem[];
  country: "KR" | "JP";
}

export default function ClusterMapView({
  clusters,
  country,
}: ClusterMapViewProps) {
  const [selectedCluster, setSelectedCluster] =
    useState<AdminClusterItem | null>(null);

  const mapConfig = MAP_CENTER[country];
  const geoMap = CLUSTER_GEO[country] || {};

  const maxUsers = useMemo(
    () => Math.max(...clusters.map((c) => c.userCount), 1),
    [clusters],
  );

  const getRadius = (userCount: number) => {
    const minRadius = 20;
    const maxRadius = 55;
    return minRadius + (userCount / maxUsers) * (maxRadius - minRadius);
  };

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[mapConfig.lat, mapConfig.lng]}
        zoom={mapConfig.zoom}
        style={{
          height: "700px",
          width: "100%",
          borderRadius: "12px",
          zIndex: 1,
        }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {clusters.map((cluster) => {
          const geo = geoMap[cluster.id];
          if (!geo) return null;

          const radius = getRadius(cluster.userCount);
          const isSelected = selectedCluster?.id === cluster.id;

          return (
            <CircleMarker
              key={cluster.id}
              center={[geo.center.lat, geo.center.lng]}
              radius={radius}
              pathOptions={{
                color: isSelected ? "#1E293B" : geo.color,
                fillColor: geo.color,
                fillOpacity: isSelected ? 0.8 : 0.5,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => setSelectedCluster(cluster),
              }}
            >
              <Tooltip direction="top" offset={[0, -radius]} permanent>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: "13px",
                      lineHeight: 1.2,
                    }}
                  >
                    {cluster.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "#64748B" }}>
                    {cluster.userCount.toLocaleString()}명
                  </p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {selectedCluster &&
          (() => {
            const geo = geoMap[selectedCluster.id];
            if (!geo) return null;
            return (
              <Popup
                position={[geo.center.lat, geo.center.lng]}
                eventHandlers={{ remove: () => setSelectedCluster(null) }}
              >
                <ClusterPopupContent
                  cluster={selectedCluster}
                  color={geo.color}
                />
              </Popup>
            );
          })()}
      </MapContainer>
      {/* 범례 */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 1000,
          padding: 16,
          maxWidth: 200,
          backgroundColor: "rgba(255,255,255,0.95)",
        }}
      >
        <p style={{ marginBottom: 8, display: "block" }}>클러스터 범례</p>
        {clusters.map((cluster) => {
          const geo = geoMap[cluster.id];
          if (!geo) return null;
          return (
            <div
              key={cluster.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: geo.color,
                  flexShrink: 0,
                }}
              ></div>
              <p>
                {cluster.name}({cluster.userCount.toLocaleString()})
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClusterPopupContent({
  cluster,
  color,
}: {
  cluster: AdminClusterItem;
  color: string;
}) {
  const sortedUnivs = [...cluster.universities].sort(
    (a, b) => b.userCount - a.userCount,
  );
  const topUnivs = sortedUnivs.slice(0, 10);

  return (
    <div style={{ minWidth: 280, maxWidth: 350 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: color,
            flexShrink: 0,
          }}
        ></div>
        <p>{cluster.name}</p>
        <Chip size="sm">{`${cluster.userCount.toLocaleString()}명`}</Chip>
      </div>
      <div
        style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}
      >
        {cluster.regions.map((r) => (
          <Chip key={r.code} size="sm">
            {r.name}
          </Chip>
        ))}
      </div>
      <div style={{ maxHeight: 300 }}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th
                scope="col"
                style={{ fontWeight: 600, paddingBlock: 4, fontSize: "12px" }}
                className="px-3 py-2 border-b border-default"
              >
                대학
              </th>
              <th
                scope="col"
                style={{ fontWeight: 600, paddingBlock: 4, fontSize: "12px" }}
                className="px-3 py-2 border-b border-default"
              >
                유저수
              </th>
            </tr>
          </thead>
          <tbody>
            {topUnivs.map((univ) => (
              <tr key={univ.id}>
                <td
                  style={{ paddingBlock: 4, fontSize: "12px" }}
                  className="px-3 py-2 border-b border-default"
                >
                  {univ.name}
                </td>
                <td
                  style={{ paddingBlock: 4, fontSize: "12px" }}
                  className="px-3 py-2 border-b border-default"
                >
                  {univ.userCount.toLocaleString()}
                </td>
              </tr>
            ))}
            {sortedUnivs.length > 10 && (
              <tr>
                <td
                  colSpan={2}
                  style={{
                    paddingBlock: 4,
                    fontSize: "11px",
                    color: "#94A3B8",
                    textAlign: "center",
                  }}
                  className="px-3 py-2 border-b border-default"
                >
                  외 {sortedUnivs.length - 10}개 대학
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
