'use client';

import { useMemo, useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import type { AdminClusterItem } from '@/types/admin';
import { CLUSTER_GEO } from '../constants';

interface ClusterTreemapViewProps {
  clusters: AdminClusterItem[];
  country: 'KR' | 'JP';
}

interface TreemapNode {
  name: string;
  size?: number;
  color?: string;
  clusterId?: string;
  universityId?: string;
  children?: TreemapNode[];
}

export default function ClusterTreemapView({ clusters, country }: ClusterTreemapViewProps) {
  const [selectedCluster, setSelectedCluster] = useState<AdminClusterItem | null>(null);
  const geoMap = CLUSTER_GEO[country] || {};

  const treemapData = useMemo(() => {
    const children: TreemapNode[] = clusters.map((cluster) => {
      const color = geoMap[cluster.id]?.color || '#94A3B8';
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

  const totalUsers = useMemo(() => clusters.reduce((sum, c) => sum + c.userCount, 0), [clusters]);

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
              cursor: 'pointer',
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
            opacity: selectedCluster && selectedCluster.id !== clusterId ? 0.2 : 0.7,
            stroke: '#fff',
            strokeWidth: 1,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
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
              fill: '#fff',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            {name.length > width / 8 ? name.slice(0, Math.floor(width / 8)) + '…' : name}
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
              fill: 'rgba(255,255,255,0.8)',
              pointerEvents: 'none',
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
      <Paper sx={{ p: 1.5, maxWidth: 220 }}>
        <Typography variant="body2" fontWeight={700}>{data.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {cluster?.name} · {data.size?.toLocaleString()}명
        </Typography>
      </Paper>
    );
  };

  return (
    <Box>
      {/* 트리맵 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            총 {totalUsers.toLocaleString()}명 · {clusters.length}개 클러스터
          </Typography>
          {selectedCluster && (
            <Typography
              variant="body2"
              sx={{ cursor: 'pointer', color: 'primary.main' }}
              onClick={() => setSelectedCluster(null)}
            >
              전체 보기
            </Typography>
          )}
        </Box>

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
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2, justifyContent: 'center' }}>
          {clusters.map((cluster) => {
            const color = geoMap[cluster.id]?.color || '#94A3B8';
            const isActive = !selectedCluster || selectedCluster.id === cluster.id;
            return (
              <Box
                key={cluster.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
                onClick={() =>
                  setSelectedCluster(selectedCluster?.id === cluster.id ? null : cluster)
                }
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '2px',
                    backgroundColor: color,
                  }}
                />
                <Typography variant="caption">
                  {cluster.name} ({cluster.userCount.toLocaleString()})
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* 선택된 클러스터 상세 테이블 */}
      {selectedCluster && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            {selectedCluster.name} — 대학별 유저 현황
          </Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>대학명</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>지역</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>유저수</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>비율</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...selectedCluster.universities]
                  .sort((a, b) => b.userCount - a.userCount)
                  .map((univ, idx) => (
                    <TableRow key={univ.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{univ.name}</TableCell>
                      <TableCell>{univ.region}</TableCell>
                      <TableCell align="right">{univ.userCount.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {selectedCluster.userCount > 0
                          ? ((univ.userCount / selectedCluster.userCount) * 100).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
