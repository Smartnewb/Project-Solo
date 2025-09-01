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
    userId: string;
    name: string;
    phoneNumber: string;
    gender: 'MALE' | 'FEMALE' | 'ALL' | 'CUSTOM' ; 
    lastLoginAt?: string;
    isWithdrawn?: boolean;
    withdrawnAt?: string;
}

// MARK: - 선택된 사용자
// export interface SelectedUser {
//     id: string;
//     name: string;
//     phoneNumber: string;
//     profileImage?: string;
//     isSelected: boolean;
// }

export type SelectedUser = User & { isSelected: boolean};



// MARK: - 발송 내역
export interface SmsHistory {
    id: string;
    templateId: string;
    templateTitle: string;
    messageContent: string;
    recipientCount: number;
    successCount: number;
    failureCount: number;
    status: 'COMPLETE' | 'FAILED' | 'PENDING'; 
    createdAt: string;
}


// MARK: - 발송 대상 필터링
export interface RecipientFilter{
    startDate: Date | null;
    endDate: Date | null;
    gender: 'all' | 'male' | 'female' | 'custom'; 
    customUsers?: User[];
}


// DESCRIPTION: - API 타입 정의

// MARK: - sms 템플릿 생성
export interface CreateTemplateRequest {
    title: string;
    content: string;
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
export interface GetTemplateByIdResponse {
    success: boolean;
    data?: SmsTemplate;
}

// MARK: - sms 템플릿 수정
export interface UpdateTemplateRequest {
    // NOTE: url에 id 존재해서 body에서 id 제거
    title: string;
    content: string;
}

export interface UpdateTemplateResponse {
    success: boolean;
    data?: SmsTemplate; // NOTE: 이 부분 Partial<SmsTemplate> 아닌가?
}

// MARK: - 템플릿 삭제
export interface RemoveTemplateResponse {
    success: boolean;
    message?: string;
}

// MARK: - 사용자 검색
export interface GetUser {
    success: boolean;
    data?: {
        users?: Array<{
            userId: string;
            name: string;
            phoneNumber: string;
            gender: 'MALE' | 'FEMALE' | 'ALL' | 'CUSTOM';
            lastLoginAt: string;
            isWithdrawn: boolean;
            withdrawnAt: string;}>
        meta: { totalCount: number; };
    }; 
}


// MARK: - 단체 발송
export interface SendSmsRequest {
    messageContent?: string;
    templateId?: string;
    templateTitle?: string;
    recipients: Array<{
        userId: string;
        name: string;
        phoneNumber: string;
    }>;
}


export interface SendSmsResponse {
    success: boolean;
    message: string; // 콘솔용 메세지
    totalCount: number;
    successCount: number;
    failureCount: number;
    historyId: string;
    groupId: string;
    templateTitle: string;
    messageContent: string;
    results?: Array<{
        phoneNumber: string;
        name: string;
        success: boolean;
        message: '전송 성공' | '전송 실패';
        error?: string;
    }>;
    
}

// MARK: - 발송 내역 조회
export interface GetHistoryResponse {
    success: boolean;
    data?: SmsHistory[];
}

// MARK: - 발송 내역 상세 조회
export interface GetHistoryDetailResponse {
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

