import type { MatchingPoolCoordinates, KoreaRegionCode, JapanRegionCode } from '@/types/admin';

interface RegionInfo {
  code: string;
  name: string;
  coordinates: MatchingPoolCoordinates;
}

export const KOREA_REGIONS: Record<KoreaRegionCode, RegionInfo> = {
  SEL: { code: 'SEL', name: '서울특별시', coordinates: { lat: 37.5665, lng: 126.978 } },
  BSN: { code: 'BSN', name: '부산광역시', coordinates: { lat: 35.1796, lng: 129.0756 } },
  DGU: { code: 'DGU', name: '대구광역시', coordinates: { lat: 35.8714, lng: 128.6014 } },
  ICN: { code: 'ICN', name: '인천광역시', coordinates: { lat: 37.4563, lng: 126.7052 } },
  GWJ: { code: 'GWJ', name: '광주광역시', coordinates: { lat: 35.1595, lng: 126.8526 } },
  DJN: { code: 'DJN', name: '대전광역시', coordinates: { lat: 36.3504, lng: 127.3845 } },
  ULS: { code: 'ULS', name: '울산광역시', coordinates: { lat: 35.5384, lng: 129.3114 } },
  SJG: { code: 'SJG', name: '세종특별자치시', coordinates: { lat: 36.48, lng: 127.289 } },
  KYG: { code: 'KYG', name: '경기도', coordinates: { lat: 37.4138, lng: 127.5183 } },
  GNG: { code: 'GNG', name: '강원특별자치도', coordinates: { lat: 37.8228, lng: 128.1555 } },
  CCN: { code: 'CCN', name: '충청북도', coordinates: { lat: 36.6357, lng: 127.4914 } },
  CAN: { code: 'CAN', name: '충청남도', coordinates: { lat: 36.6588, lng: 126.6728 } },
  JJU: { code: 'JJU', name: '전북특별자치도', coordinates: { lat: 35.8203, lng: 127.1089 } },
  YSU: { code: 'YSU', name: '전라남도', coordinates: { lat: 34.8161, lng: 126.4629 } },
  PHG: { code: 'PHG', name: '경상북도', coordinates: { lat: 36.4919, lng: 128.8889 } },
  CWN: { code: 'CWN', name: '경상남도', coordinates: { lat: 35.4606, lng: 128.2132 } },
  JJA: { code: 'JJA', name: '제주특별자치도', coordinates: { lat: 33.4996, lng: 126.5312 } },
};

export const JAPAN_REGIONS: Record<JapanRegionCode, RegionInfo> = {
  TOKYO: { code: 'TOKYO', name: '東京都', coordinates: { lat: 35.6762, lng: 139.6503 } },
  OSAKA: { code: 'OSAKA', name: '大阪府', coordinates: { lat: 34.6937, lng: 135.5023 } },
  KANAGAWA: { code: 'KANAGAWA', name: '神奈川県', coordinates: { lat: 35.4478, lng: 139.6425 } },
  AICHI: { code: 'AICHI', name: '愛知県', coordinates: { lat: 35.1802, lng: 136.9066 } },
  SAITAMA: { code: 'SAITAMA', name: '埼玉県', coordinates: { lat: 35.8617, lng: 139.6455 } },
  CHIBA: { code: 'CHIBA', name: '千葉県', coordinates: { lat: 35.6073, lng: 140.1063 } },
  HYOGO: { code: 'HYOGO', name: '兵庫県', coordinates: { lat: 34.6913, lng: 135.183 } },
  HOKKAIDO: { code: 'HOKKAIDO', name: '北海道', coordinates: { lat: 43.0642, lng: 141.3469 } },
  FUKUOKA: { code: 'FUKUOKA', name: '福岡県', coordinates: { lat: 33.5904, lng: 130.4017 } },
  KYOTO: { code: 'KYOTO', name: '京都府', coordinates: { lat: 35.0116, lng: 135.7681 } },
};

export const MAP_CENTER = {
  KR: { lat: 36.5, lng: 127.5, zoom: 7 },
  JP: { lat: 36.5, lng: 138.0, zoom: 6 },
} as const;

export const getRegionInfo = (country: 'KR' | 'JP', regionCode: string): RegionInfo | null => {
  if (country === 'KR') {
    return KOREA_REGIONS[regionCode as KoreaRegionCode] || null;
  }
  return JAPAN_REGIONS[regionCode as JapanRegionCode] || null;
};
