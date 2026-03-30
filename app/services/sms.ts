// TITLE: - sms API 서비스 로직
import { adminGet, adminPost, adminPut, adminDelete } from '@/shared/lib/http/admin-fetch';
import {
    SmsTemplate,
    User,
    SendSmsRequest,
    SendSmsResponse,
    SmsHistory,
    GetHistoryDetailResponse,
    UserSearchResponse,
} from "../admin/sms/types";


// MARK: - 엔드포인트 정의
const SMS_ENDPOINTS = {
    TEMPLATE: '/admin/v2/sms/templates',
    TEMPLATE_BY_ID: (id: string) =>  `/admin/v2/sms/templates/${id}`,
    HISTORY: '/admin/v2/sms/histories',
    HISTORY_BY_ID: (id: string) =>  `/admin/v2/sms/histories/${id}`,
    SEND_MESSAGE: '/admin/v2/sms/send-bulk',
    USER_SEARCH: '/admin/v2/sms/users/search'
} as const;

// MARK: - 로컬스토리지 헬퍼 함수
class LocalStorageHelper {
    static getItem<T>(key: string, defaultValue?: T): T | null {
        if (typeof window === 'undefined') return defaultValue || null;

        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : (defaultValue || null);

        } catch (error) {
            console.error(`Error reading: ${key}:`, error);
            return defaultValue || null;
        }
    }

    static setItem<T>(key: string, value: T): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch(error) {
            console.error(`Error saving ${key}`, error);
        }
    }

    static removeItem(key: string): void {
        if (typeof window === 'undefined') return;

        localStorage.removeItem(key);
    }
}


// MARK: - API 클라이언트
export const smsService = {
    async createTemplate(data: {
        title: string;
        content: string;
        variables?: string[];
    }): Promise<SmsTemplate> {
        try {
            return await adminPost<SmsTemplate>(SMS_ENDPOINTS.TEMPLATE, data);
        } catch (error) {
            throw new SmsApiError('템플릿 생성 실패', error);
        }
    },

    async getTemplates(): Promise<SmsTemplate[]>{
        try {
            return await adminGet<SmsTemplate[]>(SMS_ENDPOINTS.TEMPLATE);
        } catch(error) {
            throw new SmsApiError('템플릿 조회 실패', error);
        }
    },

    async getTemplateById(id: string): Promise<SmsTemplate> {
        try {
            return await adminGet<SmsTemplate>(SMS_ENDPOINTS.TEMPLATE_BY_ID(id));
        } catch (error) {
            throw new SmsApiError(`템플릿(${id}) 조회 실패`, error);
        }
    },

    async updateTemplate(id: string, data: Partial<SmsTemplate>
    ): Promise<SmsTemplate> {
        try {
            return await adminPut<SmsTemplate>(SMS_ENDPOINTS.TEMPLATE_BY_ID(id), data);
        } catch(error) {
            throw new SmsApiError('템플릿 수정 실패', error);
        }
    },

    async removeTemplate(id: string): Promise<void> {
        try {
            await adminDelete(SMS_ENDPOINTS.TEMPLATE_BY_ID(id));
        } catch(error) {
            throw new SmsApiError(`템플릿(${id}) 삭제 실패`, error);
        }
    },

    async searchUser(params: {
        startDate?: string;
        endDate?: string;
        gender?: 'MALE' | 'FEMALE';
        searchTerm?: string;
        includeWithdrawn?: boolean;
        includeRejected?: boolean;
    }): Promise<UserSearchResponse> {
        try {
            const stringParams: Record<string, string> = {};
            if (params.startDate) stringParams.startDate = params.startDate;
            if (params.endDate) stringParams.endDate = params.endDate;
            if (params.gender) stringParams.gender = params.gender;
            if (params.searchTerm) stringParams.searchTerm = params.searchTerm;
            if (params.includeWithdrawn != null) stringParams.includeWithdrawn = String(params.includeWithdrawn);
            if (params.includeRejected != null) stringParams.includeRejected = String(params.includeRejected);

            const result = await adminGet<UserSearchResponse>(SMS_ENDPOINTS.USER_SEARCH, stringParams);
            return result || { users: [], meta: { totalCount: 0 } };
        } catch (error) {
            throw new SmsApiError('사용자 검색 실패', error);
        }
    },

    async sendBulkSms(data: SendSmsRequest): Promise<SendSmsResponse> {
        try {
            return await adminPost<SendSmsResponse>(SMS_ENDPOINTS.SEND_MESSAGE, data);
        } catch(error) {
            throw new SmsApiError('문자 메세지 발송 실패', error);
        }
    },

    async getHistory(params?: {
        limit?: number
    }): Promise<SmsHistory[]> {
        try {
            const stringParams: Record<string, string> = {};
            if (params?.limit != null) stringParams.limit = String(params.limit);
            return await adminGet<SmsHistory[]>(SMS_ENDPOINTS.HISTORY, stringParams);
        } catch(error) {
            throw new SmsApiError('sms 내역 조회 실패', error);
        }
    },

    async getHistoryDetail(id: string): Promise<GetHistoryDetailResponse> {
        try {
            return await adminGet<GetHistoryDetailResponse>(SMS_ENDPOINTS.HISTORY_BY_ID(id));
        } catch(error) {
            throw new SmsApiError(`발송 내역 상세 조회 실패 (${id})`, error);
        }
    }
};


// MARK: - 에러처리
export class SmsApiError extends Error {
    public statusCode?: number; // HTTP status code
    public details?: any; // 에러 상세정보
    public originalError?: any; // 원본 에러 객체

    constructor(message: string, originalError?: any) {
        super(message); 

        this.name = 'SmsApiError';
        this.originalError = originalError;

        if (originalError?.response) {
            this.statusCode = originalError.response.status;
            this.details = originalError.response.data;

        }
    }
}
