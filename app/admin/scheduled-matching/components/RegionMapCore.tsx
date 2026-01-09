'use client';

import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MatchingPoolRegionStats } from '@/types/admin';
import type { RegionMapData } from './RegionMapView';
import { MAP_CENTER } from '../constants/regionCoordinates';
import RegionPopupContent from './RegionPopupContent';

interface RegionMapCoreProps {
  data: RegionMapData;
}

export default function RegionMapCore({ data }: RegionMapCoreProps) {
  const [selectedRegion, setSelectedRegion] = useState<MatchingPoolRegionStats | null>(null);
  const mapConfig = MAP_CENTER[data.country];

  const maxUsers = useMemo(
    () => Math.max(...data.regions.map((r) => r.users.total), 1),
    [data.regions]
  );

  const getRadius = (total: number) => {
    const minRadius = 12;
    const maxRadius = 45;
    return minRadius + (total / maxUsers) * (maxRadius - minRadius);
  };

  const getColor = (genderRatio: number | null) => {
    if (genderRatio === null) return '#9CA3AF';
    if (genderRatio > 1.2) return '#3B82F6';
    if (genderRatio < 0.8) return '#EC4899';
    return '#8B5CF6';
  };

  const handleMarkerClick = (region: MatchingPoolRegionStats) => {
    setSelectedRegion(region);
  };

  return (
    <MapContainer
      center={[mapConfig.lat, mapConfig.lng]}
      zoom={mapConfig.zoom}
      style={{
        height: '1000px',
        width: '100%',
        borderRadius: '8px',
        zIndex: 1,
      }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {data.regions.map((region) => {
        const color = getColor(region.users.genderRatio);
        const radius = getRadius(region.users.total);

        return (
          <CircleMarker
            key={region.regionCode}
            center={[region.coordinates.lat, region.coordinates.lng]}
            radius={radius}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.6,
              weight: 2,
            }}
            eventHandlers={{
              click: () => handleMarkerClick(region),
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} permanent>
              <span style={{ fontWeight: 600, fontSize: '12px' }}>
                {region.users.total.toLocaleString()}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {selectedRegion && (
        <Popup
          position={[selectedRegion.coordinates.lat, selectedRegion.coordinates.lng]}
          eventHandlers={{
            remove: () => setSelectedRegion(null),
          }}
        >
          <RegionPopupContent region={selectedRegion} />
        </Popup>
      )}
    </MapContainer>
  );
}
