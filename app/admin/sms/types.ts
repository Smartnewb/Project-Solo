// MARK: - 어드민 sms 발송 관련 타입 정의
// TODO: - 추후 백엔드 리스폰과 매핑할 것


// SECTION: - sms 템플싯
export interface SmsTemplate {
    id: string; // TODO: 타입 체크 필요
    title: string; // 템플릿 타이틀
    content: string;
    createdAt: string;
    variable?: string[]; // {name}, {date} 자동 삽입용
}

// SECTION: - 사용자
export interface User {
    id: string;
    gender: 'male' | 'female' ; // NOTE: 사용자 정의 성별이 존재하는지 확인 필요
    name: string;
    phoneNumber: string;
    profileImage?: string;
}

// SECTION: - 선택된 사용자
export interface selectedUser {
    id: string;
    name: string;
    phoneNumber: string;
    profileImage?: string;
    isSelected: boolean;
}



// SECTION: - 발송 내역
export interface SmsHistory {
    id: string;
    sentAt: string;
    status: 'success' | 'failed' ; 
    recipientCount: number; 
    recipientTemplate?: string; // FIX : 사용된 템플릿 , 없는 경우 발송 날짜
    filterCriteria?: RecipientFilter;
}


// SECTION: - 발송 대상 필터링
export interface RecipientFilter{
    startDate: Date | null;
    endDate: Date | null;
    gender: 'all' | 'male' | 'female' ; // FIX: 사용자 정의 추가
    customUsers?: User[]
}


