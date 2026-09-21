import type { MatchingPoolCoordinates } from '@/types/admin';

interface ClusterGeoInfo {
  center: MatchingPoolCoordinates;
  color: string;
}

// KR 클러스터 중심 좌표 및 색상
export const KR_CLUSTER_GEO: Record<string, ClusterGeoInfo> = {
  SEOUL_CLUSTER: { center: { lat: 37.5665, lng: 126.978 }, color: '#3B82F6' },
  CHEONAN_CLUSTER: { center: { lat: 36.8151, lng: 127.1139 }, color: '#8B5CF6' },
  BUSAN_CLUSTER: { center: { lat: 35.1796, lng: 129.0756 }, color: '#EC4899' },
  DAEGU_CLUSTER: { center: { lat: 35.8714, lng: 128.6014 }, color: '#F59E0B' },
  DAEJEON_CLUSTER: { center: { lat: 36.3504, lng: 127.3845 }, color: '#10B981' },
  GWANGJU_CLUSTER: { center: { lat: 35.1595, lng: 126.8526 }, color: '#EF4444' },
  GANGWON_CLUSTER: { center: { lat: 37.8228, lng: 128.1555 }, color: '#06B6D4' },
  JEJU_CLUSTER: { center: { lat: 33.4996, lng: 126.5312 }, color: '#F97316' },
};

// JP 클러스터 중심 좌표 및 색상
export const JP_CLUSTER_GEO: Record<string, ClusterGeoInfo> = {
  KANTO_CLUSTER: { center: { lat: 35.6762, lng: 139.6503 }, color: '#3B82F6' },
  KANSAI_CLUSTER: { center: { lat: 34.6937, lng: 135.5023 }, color: '#EC4899' },
  CHUBU_CLUSTER: { center: { lat: 35.1802, lng: 136.9066 }, color: '#F59E0B' },
  TOHOKU_CLUSTER: { center: { lat: 38.2688, lng: 140.8721 }, color: '#10B981' },
  KYUSHU_CLUSTER: { center: { lat: 33.5904, lng: 130.4017 }, color: '#EF4444' },
  HOKKAIDO_CLUSTER: { center: { lat: 43.0642, lng: 141.3469 }, color: '#06B6D4' },
};

export const CLUSTER_GEO: Record<string, Record<string, ClusterGeoInfo>> = {
  KR: KR_CLUSTER_GEO,
  JP: JP_CLUSTER_GEO,
};

export const MAP_CENTER = {
  KR: { lat: 36.5, lng: 127.5, zoom: 7 },
  JP: { lat: 36.5, lng: 138.0, zoom: 6 },
} as const;

// Treemap 클러스터 색상 팔레트
export const CLUSTER_COLORS = [
  '#3B82F6', '#EC4899', '#F59E0B', '#10B981',
  '#EF4444', '#8B5CF6', '#06B6D4', '#F97316',
];
