import { paymentType } from '../types';

// 결제 타입 매핑
export const PAYMENT_TYPE_MAP: Record<paymentType, string> = {
    'all': '전체',
    'iap_only': 'Apple 인앱 결제',
    'exclude_iap': 'WELCOME payment'
};

// 결제 타입 옵션 배열
export const PAYMENT_TYPE_OPTIONS = Object.entries(PAYMENT_TYPE_MAP).map(([code, name]) => ({
    value: code as paymentType,
    label: name
}));

// 결제 타입 라벨 조회 함수
export const getPaymentTypeLabel = (type: paymentType): string => {
    return PAYMENT_TYPE_MAP[type] || type;
};