'use client';

import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { AdminClusterItem } from '@/types/admin';
import { CLUSTER_GEO, MAP_CENTER } from '../constants';

interface ClusterMapViewProps {
  clusters: AdminClusterItem[];
  country: 'KR' | 'JP';
}

export default function ClusterMapView({ clusters, country }: ClusterMapViewProps) {
  const [selectedCluster, setSelectedCluster] = useState<AdminClusterItem | null>(null);

  const mapConfig = MAP_CENTER[country];
  const geoMap = CLUSTER_GEO[country] || {};

  const maxUsers = useMemo(
    () => Math.max(...clusters.map((c) => c.userCount), 1),
    [clusters]
  );

  const getRadius = (userCount: number) => {
    const minRadius = 20;
    const maxRadius = 55;
    return minRadius + (userCount / maxUsers) * (maxRadius - minRadius);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <MapContainer
        center={[mapConfig.lat, mapConfig.lng]}
        zoom={mapConfig.zoom}
        style={{
          height: '700px',
          width: '100%',
          borderRadius: '12px',
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
                color: isSelected ? '#1E293B' : geo.color,
                fillColor: geo.color,
                fillOpacity: isSelected ? 0.8 : 0.5,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => setSelectedCluster(cluster),
              }}
            >
              <Tooltip direction="top" offset={[0, -radius]} permanent>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.2 }}>
                    {cluster.name}
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                    {cluster.userCount.toLocaleString()}명
                  </Typography>
                </Box>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {selectedCluster && (() => {
          const geo = geoMap[selectedCluster.id];
          if (!geo) return null;
          return (
            <Popup
              position={[geo.center.lat, geo.center.lng]}
              eventHandlers={{ remove: () => setSelectedCluster(null) }}
            >
              <ClusterPopupContent cluster={selectedCluster} color={geo.color} />
            </Popup>
          );
        })()}
      </MapContainer>

      {/* 범례 */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          p: 2,
          maxWidth: 200,
          backgroundColor: 'rgba(255,255,255,0.95)',
        }}
      >
        <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
          클러스터 범례
        </Typography>
        {clusters.map((cluster) => {
          const geo = geoMap[cluster.id];
          if (!geo) return null;
          return (
            <Box key={cluster.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: geo.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" noWrap>
                {cluster.name} ({cluster.userCount.toLocaleString()})
              </Typography>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
}

function ClusterPopupContent({
  cluster,
  color,
}: {
  cluster: AdminClusterItem;
  color: string;
}) {
  const sortedUnivs = [...cluster.universities].sort((a, b) => b.userCount - a.userCount);
  const topUnivs = sortedUnivs.slice(0, 10);

  return (
    <Box sx={{ minWidth: 280, maxWidth: 350 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <Typography variant="subtitle1" fontWeight={700}>
          {cluster.name}
        </Typography>
        <Chip
          label={`${cluster.userCount.toLocaleString()}명`}
          size="small"
          sx={{ ml: 'auto', fontWeight: 600 }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
        {cluster.regions.map((r) => (
          <Chip key={r.code} label={r.name} size="small" variant="outlined" />
        ))}
      </Box>

      <TableContainer sx={{ maxHeight: 300 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, py: 0.5, fontSize: '12px' }}>대학</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, py: 0.5, fontSize: '12px' }}>
                유저수
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topUnivs.map((univ) => (
              <TableRow key={univ.id} hover>
                <TableCell sx={{ py: 0.5, fontSize: '12px' }}>{univ.name}</TableCell>
                <TableCell align="right" sx={{ py: 0.5, fontSize: '12px' }}>
                  {univ.userCount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {sortedUnivs.length > 10 && (
              <TableRow>
                <TableCell colSpan={2} sx={{ py: 0.5, fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>
                  외 {sortedUnivs.length - 10}개 대학
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
