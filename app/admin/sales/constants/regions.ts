// 지역 코드와 한글명 매핑
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
    'CAN': '천안'
};

// 지역 옵션 배열 (select 옵션용)
export const REGION_OPTIONS = [
    { value: 'all', label: '전체' },
    ...Object.entries(REGION_MAP)
        .filter(([code]) => code !== 'all')
        .map(([code, name]) => ({
            value: code,
            label: name
        }))
];

// 지역 라벨 조회 함수
export const getRegionLabel = (regionCode: string): string => {
    return REGION_MAP[regionCode] || regionCode;
};
