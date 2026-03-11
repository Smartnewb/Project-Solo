// MARK: - 개별 지역 코드와 한글명 매핑
export const REGION_MAP: Record<string, string> = {
    'all': '전체',
    'DJN': '대전',
    'SJG': '세종',
    'CJU': '청주',
    'BSN': '부산',
    'DGU': '대구',
    'GJJ': '공주',
    'GHE': '김해',
    'ICN': '인천',
    'SEL': '서울',
    'KYG': '경기',
    'CAN': '천안',
    'GWJ': '광주',
    'GNG': '강원',
    'JJA': '제주'
};

// MARK: - 클러스터 지역 코드와 한글명 매핑
export const CLUSTER_REGION_MAP: Record<string, string> = {
    'all': '전체',
    'ICN': '수도권',
    'DJN': '충청권',
    'BSN': '부산/김해',
    'DGU': '대구',
    'GWJ': '광주',
    'GNG': '강원',
    'JJA': '제주',
};

// 개별 지역 옵션 배열 (select 옵션용)
export const REGION_OPTIONS = [
    { value: 'all', label: '전체' },
    ...Object.entries(REGION_MAP)
        .filter(([code]) => code !== 'all')
        .map(([code, name]) => ({
            value: code,
            label: name
        }))
];

// 클러스터 옵션 배열 (매출 통계용)
export const CLUSTER_REGION_OPTIONS = [
    { value: 'all', label: '전체' },
    ...Object.entries(CLUSTER_REGION_MAP)
        .filter(([code]) => code !== 'all')
        .map(([code, name]) => ({
            value: code,
            label: name
        }))
];

// 개별 지역 라벨 조회 함수
export const getRegionLabel = (regionCode: string): string => {
    return REGION_MAP[regionCode] || regionCode;
};

// 클러스터 라벨 조회 함수
export const getClusterRegionLabel = (regionCode: string): string => {
    return CLUSTER_REGION_MAP[regionCode] || regionCode;
};
