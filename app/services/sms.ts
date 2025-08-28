// TITLE: - sms API 서비스 로직
import axiosServer from "@/utils/axios";
import { 
    SmsTemplate,
    User,
    SendSmsRequest,
    SendSmsResponse,
    SmsHistory,
    GetHistoryDetailResponse
} from "../admin/sms/types";


// MARK: - 엔드포인트 정의
const SMS_ENDPOINTS = {
    TEMPLATE: '/api/admin/sms/templates',
    TEMPLATE_BY_ID: (id: string) =>  `/api/admin/sms/templates/${id}`,
    HISTORY: '/api/admin/sms/histories',
    HISTORY_BY_ID: (id: string) =>  `/api/admin/sms/histories/${id}`,
    SEND_MESSAGE: '/api/admin/sms/send-bulk',
    USER_SEARCH: '/api/admin/sms/users/search'
} as const;

// MARK: - 로컬스토리지 헬퍼 함수
class LocalStorageHelper {
    // 데이터 조회
    static getItem<T>(key: string, defaultValue?: T): T | null {
        // SSR 환경 체크(서버환경이면 defaultValue 리턴)
        if (typeof window === 'undefined') return defaultValue || null;

        try {
            //  브라우저 저장소에서 데이터 가져오기
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : (defaultValue || null);

        } catch (error) {
            // 에러 출력
            console.error(`Error reading: ${key}:`, error);
            return defaultValue || null;
        }
    }  

    // 데이터 저장
    static setItem<T>(key: string, value: T): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch(error) {
            console.log(`Error saving ${key}`, error);
        }
    }

    // 데이터 삭제
    static removeItem(key: string): void {
        if (typeof window === 'undefined') return;

        localStorage.removeItem(key);
    }
}


// MARK: - API 클라이언트
export const smsService = {
    // === 템플릿 ===
    // 템플릿 생성
    async createTemplate(data: {
        title: string;
        content: string;
        variables?: string[];
    }): Promise<SmsTemplate> {
        try {
            const response = await axiosServer.post(SMS_ENDPOINTS.TEMPLATE,data);
            return response.data;
        } catch (error) {
            throw new SmsApiError('템플릿 생성 실패', error);
        }

    },

    // 템플릿 목록 조회
    async getTemplates(): Promise<SmsTemplate[]>{
        try {
            const response = await axiosServer.get(SMS_ENDPOINTS.TEMPLATE);
            return response.data;
        } catch(error) {
            throw new SmsApiError('템플릿 조회 실패', error);
        }
    },
    

    // 특정 템플릿 조회
    async getTemplateById(id: string): Promise<SmsTemplate> {
        try {
            const url = SMS_ENDPOINTS.TEMPLATE_BY_ID(id);
            const response = await axiosServer.get(url);
            return response.data;
        } catch (error) {
            throw new SmsApiError(`템플릿(${id}) 조회 실패`, error);
        }
    },

    // 템플릿 수정
    async updateTemplate(id: string, data: Partial<SmsTemplate>
    ): Promise<SmsTemplate> {
        try {
            const url = SMS_ENDPOINTS.TEMPLATE_BY_ID(id);
            const response = await axiosServer.put(url, data);
            return response.data;
        } catch(error) {
            throw new SmsApiError('템플릿 수정 실패', error);
        }
    },

    // 템플릿 삭제
    async removeTemplate(id: string): Promise<void> {
        try {
            const url = SMS_ENDPOINTS.TEMPLATE_BY_ID(id);
            const response = await axiosServer.delete(url);
            return response.data;
        } catch(error) {
            throw new SmsApiError(`템플릿(${id}) 삭제 실패`, error);
        }
    },
    // === 사용자 ===
    // 사용자 검색
    async searchUser(params: {
        startDate?: string,
        endDate?: string,
        gender?: 'male' | 'female' | 'all' | 'custom',
        searchTerm?: string,
        includeWithdrawn?: boolean,
        includeRejected?: boolean

    }): Promise<User[]> {
        try {
            const response = await axiosServer.get(SMS_ENDPOINTS.USER_SEARCH, { params: params });
            return response.data;
        } catch (error) {
            throw new SmsApiError('사용자 검색 실패', error);
        }
    },

    // === sms 발송 ===

    // 단체 발송
    async sendBulkSms(data: SendSmsRequest): Promise<SendSmsResponse> {
        try {
            const response = await axiosServer.post(SMS_ENDPOINTS.SEND_MESSAGE, data);
            return response.data;
        } catch(error) {
            throw new SmsApiError('문자 메세지 발송 실패', error);
        }
    },

    // === 발송 내역 조회 ===
    // 발송 내역 조회
    async getHistory(params?: {
        limit?: number
    }): Promise<SmsHistory[]> {
        try {
            const response = await axiosServer.get(SMS_ENDPOINTS.HISTORY, { params: params });
            return response.data;
        } catch(error) {
            throw new SmsApiError('sms 내역 조회 실패', error);
        }
    },

    // 발송 내역 상세 NOTE: 필요한 기능인지 체크
    async getHistoryDetail(id: string): Promise<GetHistoryDetailResponse> {
        try {
            const url = SMS_ENDPOINTS.HISTORY_BY_ID(id);
            const response = await axiosServer.get(url);
            return response.data;
        } catch(error) {
            throw new SmsApiError(`발송 내역 상세 조회 실패 (${id})`, error);
        }
    }

    // === utils ===

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
