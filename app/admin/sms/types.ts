// TITLE: - 어드민 sms 발송 관련 타입 정의


// DESCRIPTION: - 기본 데이터 타입 정의
// MARK: - sms 템플릿
export interface SmsTemplate {
    id: string; // TODO: 타입 체크 필요
    title: string; // 템플릿 타이틀
    content: string;
    createdAt: string;
    updatedAt: string;
    variables?: string[]; // {name}, {date} 자동 삽입용
}

// MARK: - 사용자
export interface User {
    id: string;
    gender: 'male' | 'female' ; // NOTE: 사용자 정의 성별이 존재하는지 확인 필요
    name: string;
    phoneNumber: string;
    profileImage?: string;
}

// MARK: - 선택된 사용자
export interface SelectedUser {
    id: string;
    name: string;
    phoneNumber: string;
    profileImage?: string;
    isSelected: boolean;
}



// MARK: - 발송 내역
export interface SmsHistory {
    id: string;
    templateTitle: string;
    messageContent: string;
    createdAt: string;
    status: 'success' | 'failed' ; 
    recipientCount: number; 
    filterCriteria?: RecipientFilter;
}


// MARK: - 발송 대상 필터링
export interface RecipientFilter{
    startDate: Date | null;
    endDate: Date | null;
    gender: 'all' | 'male' | 'female' ; // FIX: 사용자 정의 추가
    customUsers?: User[];
}


// DESCRIPTION: - API 타입 정의

// MARK: - sms 템플릿 생성
export interface CreateTemplateRequest {
    title: string;
    content: string;
    variables?: string[];
}

export interface CreateTemplateResponse {
    success: boolean;
    data?: SmsTemplate;
}

// MARK: - sms 템플릿 목록 조회
export interface GetTemplatesResponse {
    success: boolean;
    data?: SmsTemplate[];
} 

// MARK: - 특정 sms 템플릿 조회
export interface GetTemplateById {
    success: boolean;
    data?: SmsTemplate;
}

// MARK: - sms 템플릿 수정
export interface UpdateTemplateRequest {
    // NOTE: url에 id 존재해서 body에서 id 제거
    title?: string;
    content?: string;
    variables?: string[];
}

export interface UpdateTemplateResponse {
    success: boolean;
    data?: SmsTemplate;
}

// MARK: - 템플릿 삭제
export interface DeleteTemplate {
    success: boolean;
    message?: string;
}

// MARK: - 사용자 검색
export interface GetUser {
    success: boolean;
    data?: User[]; 
}


// MARK: - 단체 발송
export interface SendSmsRequest {
    messageContent: string;
    templateId: string;
    templateTitle: string;
    recipients: Array<{
        userId: string;
        name: string;
        phoneNumber: string;
    }>;
}


export interface SendSmsResponse {
    success: boolean;
    data?: {
        totalCount: number;
        successCount: number;
        failureCount: number;
        historyId: string;
        groupId: string;
        templateTitle: string;
        messageContent: string;
        result?: Array<{
            phoneNumber: string;
            name: string;
            success: boolean;
            message: '전송 성공' | '전송 실패';
            error?: string;
        }>;
    };
}

// MARK: - 발송 내역 조회
export interface GetHistory {
    success: boolean;
    data?: SmsHistory[];
}

// MARK: - 발송 내역 상세 조회
export interface GetHistoryDetail {
    success: boolean;
    data?: {
        history: SmsHistory;
        recipients: Array<{
            userId: string;
            name: string;
            phoneNumber: string;
            success: boolean;
            message: string;
            error?: string;
        }>;
    };
}