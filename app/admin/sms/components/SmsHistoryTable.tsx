// TITLE: - 메세지 발송 내역 테이블
'use client';

import { useState, useEffect } from 'react';
import { SmsHistory } from '../types';
import { formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters'; // 날짜&시간 포맷터(yyyy-mm-dd hh:mm) 

// MARK: - 메세지 발송 내역 props
interface SmsHistoryTableProps {
    histories?: SmsHistory[];
    limit?: number;
}

// MARK: - 메세지 발송 내역 컴포넌트
export function SmsHistoryTable({ histories, limit = 50}: SmsHistoryTableProps) {
    // === 상태관리 ===
    const  [data, setData] = useState<SmsHistory[]>([]);
    const [loading, setLoading] = useState(false);

    // === Hook ===
    useEffect(() => {
        // 상위 limit(default: 50개)
        if (histories) {
            setData(histories.slice(0,limit));
        } else {
            // NOTE: - 임시 목업 데이터 / 추후 삭제
            const mockData: SmsHistory[] = [
                {
                    id: '1',
                    templateId: 'temp-001',
                    templateTitle: '신규 회원 환영 메세지',    
                    messageContent: '안녕하세요 {name}님, 서비스 가입을 환영합니다...',
                    recipientCount: 10,
                    successCount: 8,
                    failureCount: 2,
                    status: 'success',
                    createdAt: '2025-01-15T13:45:00Z',
                },
                {
                    id: '2',
                    templateId: 'temp-002',
                    templateTitle: '신규 회원 환영 메세지',    
                    messageContent: '안녕하세요 {name}님, 서비스 가입을 환영합니다...',
                    recipientCount: 10,
                    successCount: 8,
                    failureCount: 2,
                    status: 'Failed',
                    createdAt: '2025-01-15T13:45:00Z',
                },
                {
                    id: '3',
                    templateId: 'temp-003',
                    templateTitle: '신규 회원 환영 메세지',    
                    messageContent: '안녕하세요 {name}님, 서비스 가입을 환영합니다...',
                    recipientCount: 10,
                    successCount: 8,
                    failureCount: 2,
                    status: 'success',
                    createdAt: '2025-01-15T13:45:00Z',
                }    
            ];
            setData(mockData);
        }
    }, [histories, limit]);

    // === 템플릿명 처리 함수 ===
    const getTemplateName = (history: SmsHistory) => {
        if (history.templateTitle) {
            return history.templateTitle;
        } else {
            // 템플릿명 존재하지 않으면 현재 날짜 삽입
            return formatDateTimeWithoutTimezoneConversion(history.createdAt);
        }
    };

    // === 상태별 스타일 변환 ===
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'success':
                return 'text-white bg-[#8355E8]';
            default:
                return 'text-[#1F2937] bg-[#F3F4F6]';
        }
    };





    // === 렌더링(JSX) ===
    return (<>
        {/* MARK: - 전체 컨테이너 */}
        <div className="">
            {/* MARK: - 테이블 헤더 */}
            <div className=''>
                <h3>최근 발송 내역</h3>
                <p>최근 {limit}건의 발송 내역입니다</p>
            </div>

            {/* MARK: - 테이블 콘텐츠 영역*/}
            <div className='px-4 sm:px-6 pb-4'>
                {loading ? (
                    // 로딩 스피너
                    <div className='flex justify-center items-center py-12'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
                    </div>
                ) : data.length === 0 ? (
                    // 발송 내역 없는 경우
                    <div className='text-center py-12'>
                        <p className='text-gray-500 text-sm'>발송 내역이 없습니다</p>
                    </div>
                ) : (
                    // 발송 내역 카드 리스트
                    <div className='space-y-3'>
                        {data.map((history) => (
                            // MARK: - 카드 컨테이너
                            <div
                                key={history.id}
                                className='border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow'>
                                {/* MARK: - 카드 내용 */}
                                <div className='flex justify-between items-center'>
                                    <div className='flex-1'>
                                        {/* MARK: - 템플릿 명*/}
                                        <div className='font-medium text-gray-900 text-sm sm:text-base'>
                                            {getTemplateName(history)}
                                        </div>
                                        {/* MARK: - 날짜 및 정보
                                        TODO:
                                        - 텍스트 스타일 및 반응형으로 변경*/}
                                        <div className='flex font-[400] text-[#1F2937]'>
                                            <span>{formatDateTimeWithoutTimezoneConversion(history.createdAt)}</span>
                                            <span>•</span>
                                            <span>{history.successCount}명 발송 완료</span> {/*FOLLOW: 성공명수/실패명수 렌더링 할 것인지 확인 */}
                                        </div>
                                    </div>

                                    {/* 상태값 */}
                                    <div>
                                        <span className={`
                                            inline-flex items-center
                                            px-2 py-1
                                            rounded-full
                                            text-xs font-medium
                                            ${getStatusStyle(history.status)}`}>
                                                {history.status === 'success' ? '완료' : '실패'}
                                            </span>
                                    </div>

                                </div>
                            </div>
                        ))}

                    </div>
                )}
            
            </div>

        </div>
    </>);
}