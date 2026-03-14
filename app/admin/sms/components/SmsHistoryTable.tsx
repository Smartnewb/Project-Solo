// TITLE: - 메세지 발송 내역 테이블
'use client';

import { useState, useEffect } from 'react';
import { SmsHistory } from '../types';
import { formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters'; // 날짜&시간 포맷터(yyyy-mm-dd hh:mm) 
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { smsService } from '@/app/services/sms';

// MARK: - 메세지 발송 내역 props
interface SmsHistoryTableProps {
    histories?: SmsHistory[];
    limit?: number;
}

// MARK: - 메세지 발송 내역 컴포넌트
export function SmsHistoryTable({ histories, limit = 50 }: SmsHistoryTableProps) {
    // === 상태관리 ===
    const [data, setData] = useState<SmsHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = data.slice(startIndex, endIndex);




    useEffect(() => {
        const fetchHistories = async () => {
            setLoading(true);
            try {
                const response = await smsService.getHistory({
                    limit: limit,
                });
                setData(response || []); 
            } catch (error) {
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        // 상위 limit(default: 50개)
        if (histories) {
            setData(histories.slice(0, limit));
        } else {
            fetchHistories();
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
            case 'COMPLETED':  // 🔴 COMPLETE → COMPLETED로 수정(매우 주의)
            case 'SUCCESS':
                return 'text-white bg-[#885AEB]';
            case 'FAILED':
                return 'text-white bg-red-500';
            default:
                return 'text-[#1F2937] bg-[#F3F4F6] border border-[#D1D5DB] border-[0.5px]';
        }
    };

    // 상태 표시 텍스트를 위한 함수 추가 (getStatusStyle 함수 아래)
    const getStatusText = (status: string) => {
        const upperStatus = status?.toUpperCase();
        switch (upperStatus) {
            case 'SUCCESS':
            case 'COMPLETE':
            case 'COMPLETED':
            case 'SENT':
                return '완료';
            case 'FAILED':
            case 'ERROR':
                return '실패';
            case 'PENDING':
            case 'PROCESSING':
                return '처리중';
            default:
                return status; // 원본 그대로 표시
        }
    };


    // === 렌더링(JSX) ===
    return (<>
        {/* MARK: - 전체 컨테이너 */}
        <div className="bg-white border border-[#D1D5DB] rounded-lg w-full px-4 sm:px-6 py-3 sm:py-4 border-box">
            {/* MARK: - 테이블 헤더 */}
            <div className='pb-2'>
                <h3 className='text-base sm:text-lg font-[400] text-[#111827] mb-0'>최근 발송 내역</h3>
                <p>최근 {limit}건의 발송 내역입니다</p>
            </div>

            {/* MARK: - 테이블 콘텐츠 영역*/}
            <div className='pb-4'>
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
                        {currentData.map((history) => (
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
                                        <div className='text-xs sm:text-sm text-[#6B7280] font-[400]'>
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
                                            {/* 🔴 매우 주의: COMPLETE도 완료로 표시 */}
                                            {(history.status === 'COMPLETE') ? '완료' : '실패'}
                                        </span>
                                    </div>

                                </div>
                            </div>
                        ))}

                    </div>
                )}

            </div>

            {/* MARK: - 페이지네이션 
            NOTE:
            - BE에서 페이지네이션을 해서 통신함
            - 당분간 미사용
            - notion에 코드 보관*/}



        </div>

    </>);
}
