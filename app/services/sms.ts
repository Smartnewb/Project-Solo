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
    USER_SEARCH: '/admin/v2/sms/users/search',
    RECIPIENTS_COUNT: '/admin/v2/sms/recipients/count',
    RECIPIENTS_PREVIEW: '/admin/v2/sms/recipients/preview',
    SEND_BY_FILTER: '/admin/v2/sms/send-by-filter',
    JOB_STATUS: (jobId: string) => `/admin/v2/sms/jobs/${jobId}`,
} as const;

// MARK: - 필터 기반 발송 타입
export type SmsJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type SmsJobType = 'SMS' | 'LMS';

export interface RecipientFilter {
    universityIds?: string[];
    regionCodes?: string[];
    gender?: 'MALE' | 'FEMALE';
    excludeUserIds?: string[];
    userIds?: string[];
}

export const EXCLUSION_REASON = {
    NO_CONSENT: 'NO_CONSENT',
    NO_PHONE: 'NO_PHONE',
    BOTH: 'BOTH',
} as const;
export type ExclusionReason = (typeof EXCLUSION_REASON)[keyof typeof EXCLUSION_REASON];

export interface ExcludedUser {
    userId: string;
    name: string | null;
    phoneNumber: string | null;
    reason: ExclusionReason;
}

export interface RecipientCount {
    totalMatched: number;
    smsConsented: number;
    validPhone: number;
    estimatedCost: { sms: number; lms: number };
    excludedUsers?: ExcludedUser[];
}

export interface UserSearchItem {
    id: string;
    name: string | null;
    phoneNumber: string | null;
    gender: 'MALE' | 'FEMALE' | null;
}

export async function searchUsersByQuery(
    search: string,
    page = 1,
    limit = 20,
): Promise<{ data: UserSearchItem[]; meta: { page: number; limit: number } }> {
    return adminGet(SMS_ENDPOINTS.USER_SEARCH, {
        search,
        page: String(page),
        limit: String(limit),
    });
}

export interface RecipientPreview {
    items: Array<{
        id: string;
        phoneNumber: string;
        name: string | null;
        gender: string | null;
        universityName: string | null;
        region: string | null;
    }>;
}

export interface BulkSendRequest {
    filter: RecipientFilter;
    message: string;
    type: SmsJobType;
}

export interface BulkSendResponse {
    jobId: string;
    status: Extract<SmsJobStatus, 'QUEUED'>;
    expectedCount: number;
}

export interface JobStatus {
    jobId: string;
    status: SmsJobStatus;
    totalCount: number;
    sentCount: number;
    failedCount: number;
    progress: number;
    startedAt?: string;
    completedAt?: string;
}

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
            const res = await adminPost<{ data: SmsTemplate }>(SMS_ENDPOINTS.TEMPLATE, data);
            return res.data;
        } catch (error) {
            throw new SmsApiError('템플릿 생성 실패', error);
        }
    },

    async getTemplates(): Promise<SmsTemplate[]>{
        try {
            const res = await adminGet<{ data: SmsTemplate[] }>(SMS_ENDPOINTS.TEMPLATE);
            return res.data ?? [];
        } catch(error) {
            throw new SmsApiError('템플릿 조회 실패', error);
        }
    },

    async getTemplateById(id: string): Promise<SmsTemplate> {
        try {
            const res = await adminGet<{ data: SmsTemplate }>(SMS_ENDPOINTS.TEMPLATE_BY_ID(id));
            return res.data;
        } catch (error) {
            throw new SmsApiError(`템플릿(${id}) 조회 실패`, error);
        }
    },

    async updateTemplate(id: string, data: Partial<SmsTemplate>
    ): Promise<SmsTemplate> {
        try {
            const res = await adminPut<{ data: SmsTemplate }>(SMS_ENDPOINTS.TEMPLATE_BY_ID(id), data);
            return res.data;
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
        search?: string;
        page?: number;
        limit?: number;
        universityId?: string;
        regionCode?: string;
    }): Promise<UserSearchResponse> {
        try {
            const stringParams: Record<string, string> = {};
            if (params.search) stringParams.search = params.search;
            if (params.page != null) stringParams.page = String(params.page);
            if (params.limit != null) stringParams.limit = String(params.limit);
            if (params.universityId) stringParams.universityId = params.universityId;
            if (params.regionCode) stringParams.regionCode = params.regionCode;

            // 백엔드 응답: { data: rows[], meta: { page, limit } }
            const res = await adminGet<{ data: Array<{ id: string; name: string | null; phoneNumber: string; status: string; gender: string | null }>; meta: { page: number; limit: number } }>(SMS_ENDPOINTS.USER_SEARCH, stringParams);
            const rows = res.data ?? [];
            return {
                users: rows.map(u => ({
                    userId: u.id,
                    name: u.name ?? '',
                    phoneNumber: u.phoneNumber,
                    gender: (u.gender as User['gender']) ?? 'ALL',
                })),
                meta: { totalCount: rows.length },
            };
        } catch (error) {
            throw new SmsApiError('사용자 검색 실패', error);
        }
    },

    async sendBulkSms(data: SendSmsRequest): Promise<SendSmsResponse> {
        try {
            const res = await adminPost<{ data: SendSmsResponse }>(SMS_ENDPOINTS.SEND_MESSAGE, data);
            return res.data;
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
            const res = await adminGet<{ data: SmsHistory[] }>(SMS_ENDPOINTS.HISTORY, stringParams);
            return res.data ?? [];
        } catch(error) {
            throw new SmsApiError('sms 내역 조회 실패', error);
        }
    },

    async getHistoryDetail(id: string): Promise<GetHistoryDetailResponse> {
        try {
            const res = await adminGet<{ data: GetHistoryDetailResponse }>(SMS_ENDPOINTS.HISTORY_BY_ID(id));
            return res.data;
        } catch(error) {
            throw new SmsApiError(`발송 내역 상세 조회 실패 (${id})`, error);
        }
    },

    async countRecipients(filter: RecipientFilter): Promise<RecipientCount> {
        try {
            const res = await adminPost<{ data: RecipientCount }>(SMS_ENDPOINTS.RECIPIENTS_COUNT, { filter });
            return res.data;
        } catch (error) {
            throw new SmsApiError('대상자 카운트 조회 실패', error);
        }
    },

    async previewRecipients(filter: RecipientFilter, limit = 20): Promise<RecipientPreview> {
        try {
            const res = await adminPost<{ data: RecipientPreview }>(SMS_ENDPOINTS.RECIPIENTS_PREVIEW, { filter, limit });
            return res.data;
        } catch (error) {
            throw new SmsApiError('대상자 미리보기 조회 실패', error);
        }
    },

    async sendByFilter(req: BulkSendRequest, idempotencyKey: string): Promise<BulkSendResponse> {
        try {
            const res = await adminPost<{ data: BulkSendResponse }>(
                SMS_ENDPOINTS.SEND_BY_FILTER,
                req,
                { headers: { 'Idempotency-Key': idempotencyKey } },
            );
            return res.data;
        } catch (error) {
            throw new SmsApiError('필터 기반 SMS 발송 실패', error);
        }
    },

    async getJobStatus(jobId: string): Promise<JobStatus> {
        try {
            const res = await adminGet<{ data: JobStatus }>(SMS_ENDPOINTS.JOB_STATUS(jobId));
            return res.data;
        } catch (error) {
            throw new SmsApiError(`작업 상태 조회 실패 (${jobId})`, error);
        }
    },
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
