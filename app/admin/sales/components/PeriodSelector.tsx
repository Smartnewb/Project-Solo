// TITLE: - 기간 설정 컴포넌트
'use client'


import { useEffect, useState } from 'react';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { salesService } from '@/app/services/sales';
import { Calendar as CalendarIcon,} from 'lucide-react';
import { Calendar } from '@/shared/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/shared/ui/popover';
import { DatePicker, CustomSalesResponse, TrendCustomResponse } from '../types';

interface DateSelectorProps {
    onDateRangeChange?: (range: {
        startDate: Date | undefined;
        endDate: Date | undefined;
    }) => void;
};

export function PeriodSelector ({ onDateRangeChange } : DateSelectorProps) {
    // === 상태 관리 ===
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: undefined,
        to: undefined,
    });
    const [startDateOpen, setStartDateOpen] = useState<boolean>(false);
    const [endDateOpen, setEndDateOpen] = useState<boolean>(false);
    const [dateError, setDateError] = useState<string>('');

    // === hooks ===
    // MARK: - 마운트 시, 초기화
    useEffect(() => {
        const startDate = undefined;
        const endDate = undefined;
        setDateRange({
            from: startDate,
            to: endDate,
        })
    }, []);

    // MARK: - 날짜 변경 감지 및 부모 컴포넌트에게 알림
    useEffect(()=>{
        if (dateRange.from && dateRange.to && handleValidationDate()) {
            onDateRangeChange?.({
                startDate: dateRange.from,
                endDate: dateRange.to,
            });
        }
    }, [dateRange.from, dateRange.to]);

    /// === handlers === 
    
    // MARK: - 시작일 변경
    const handleStartDateChange = (date: Date | undefined) => {
        setDateRange(prev => ({
            ...prev,
            from: date,
        }))
        setStartDateOpen(false);
        setDateError('');
    };

    // MARK: - 종료일 변경
    const handleEndDateChange = (date: Date | undefined) => {
        setDateRange(prev => ({
            ...prev,
            to: date,
        }));
        setEndDateOpen(false);
        setDateError('');
    };


    // MARK: - 날짜 범위 초기화
    const handleClearDates = () => {
        setDateRange({
            from: undefined,
            to: undefined,
        });

        // 팝오버 상태 초기화
        setStartDateOpen(false);
        setEndDateOpen(false);

        // 에러 메세지 초기화
        setDateError('');

        onDateRangeChange?.({
            startDate: undefined,
            endDate: undefined,
        })

    }


    // MARK: - 날짜 유효성 검증
    const handleValidationDate = (): boolean => {
        // 에러 메세지 초기화
        setDateError('');

        if(!dateRange.from || !dateRange.to) {
            setDateError('시작일과 종료일 모두 선택해주세요.');
            return false;
        }

        if (dateRange.from > dateRange.to) {
            setDateError('시작일은 종료일보다 이전이어야 합니다.');
            return false
        }

        // 모든 검증 통과
        return true; 
    }

    


    // === JSX === 
    return (
        <> 
            {/* MARK: - 전체 컨테이너 */}
            <div className='border border-border bg-[#FFFFFF] rounded-lg p-4 sm:p-6 mb-6'>
                {/* MARK: - 헤더  */}
                <h3 className='text-lg font-medium text-[#111827] mb-4'>기간 설정</h3>
                {/* MARK:
                - 콘텐츠 p-4
                - 날짜 설정 
                */}
                <div className='flex flex-col sm:flex-row gap-2 w-full'>
                    {/* 시작일 */}
                        <div className='flex-1 w-full'>
                            <label>시작일</label>
                            <Popover
                                open={startDateOpen}
                                onOpenChange={setStartDateOpen}>
                                <PopoverTrigger asChild>
                                    <button className={`w-full flex-1 flex px-3 py-2 text-left border rounded-md text-sm items-center justify-between
                                                ${startDateOpen
                                                ? 'border-[#7D4EE4]'
                                                : 'border-[#D1D5DB]'
                                                }`}>
                                        <span className={ dateRange.from ? '' : 'text-gray-400'}>
                                            {dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '시작일 지정'}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                                            <path d="M3 1V2H1.5C0.671875 2 0 2.67188 0 3.5V5H14V3.5C14 2.67188 13.3281 2 12.5 2H11V1C11 0.446875 10.5531 0 10 0C9.44687 0 9 0.446875 9 1V2H5V1C5 0.446875 4.55312 0 4 0C3.44688 0 3 0.446875 3 1ZM14 6H0V14.5C0 15.3281 0.671875 16 1.5 16H12.5C13.3281 16 14 15.3281 14 14.5V6Z" fill="#9CA3AF"/>
                                        </svg>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    {/* MARK: - 캘린더 */}
                                    <Calendar
                                        mode='single'
                                        selected={dateRange.from}
                                        onSelect={(date) => 
                                            setDateRange(prev => ({...prev, from:date }))
                                        }
                                        locale={ko}
                                        modifiersStyles={{
                                            tpdy: {
                                                backgroundColor: 'transparent',
                                            }
                                        }}
                                    initialFocus/>
                                    
                                    <div className='p-3 border-t flex justify-end gap-2'>
                                        <button
                                            className='px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-md border border-gray-200'
                                            onClick={() => {
                                                setDateRange(prev => ({ ...prev, from: undefined,}))
                                            }}>취소</button>
                                        <button
                                            className='px-3 py-1.5 text-sm text-white font-medium hover:bg-purple-700 rounded-md bg-[#7D4EE4]'
                                            onClick={() => {
                                                setStartDateOpen(false);
                                            }}
                                        >확인</button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        
                    
                    
                    
                    
                        <div className='flex-1 w-full'>
                            <label>종료일</label>
                            {/* 종료일 */}
                            <Popover
                                open={endDateOpen}
                                onOpenChange={setEndDateOpen}
                            >
                                <PopoverTrigger asChild>
                                    <button className={`w-full flex-1 flex px-3 py-2 text-left border rounded-md text-sm items-center justify-between
                                                ${endDateOpen
                                                ? 'border-[#7D4EE4]'
                                                : 'border-[#D1D5DB]'
                                                }`}>
                                        <span className={ dateRange.to ? '' : 'text-gray-400'}>
                                            {dateRange.to ? format(dateRange.to,'yyyy-MM-dd'):'종료일 지정'}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                                            <path d="M3 1V2H1.5C0.671875 2 0 2.67188 0 3.5V5H14V3.5C14 2.67188 13.3281 2 12.5 2H11V1C11 0.446875 10.5531 0 10 0C9.44687 0 9 0.446875 9 1V2H5V1C5 0.446875 4.55312 0 4 0C3.44688 0 3 0.446875 3 1ZM14 6H0V14.5C0 15.3281 0.671875 16 1.5 16H12.5C13.3281 16 14 15.3281 14 14.5V6Z" fill="#9CA3AF"/>
                                        </svg>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    
                                    <Calendar
                                        mode='range'
                                        selected={{
                                            from: dateRange.from,
                                            to: dateRange.to,
                                        }}
                                        onSelect={(range) => {
                                            if (range?.to) {
                                                setDateRange(prev => ({
                                                    ...prev,
                                                    to: range.to,
                                                }));
                                            }
                                        }}
                                        locale={ko}
                                        modifiersStyles={{
                                            tpdy: {
                                                backgroundColor: 'transparent',
                                            }
                                        }}
                                        disabled={(date) => dateRange.from ? date < dateRange.from : false}
                                    initialFocus/>
                                    
                                    <div className='p-3 border-t flex justify-end gap-2'>
                                        <button
                                            className='px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-md border border-gray-200'
                                            onClick={() => {
                                                setDateRange(prev => ({ ...prev, from: undefined,}))
                                            }}>취소</button>
                                        <button
                                            className='px-3 py-1.5 text-sm text-white font-medium hover:bg-purple-700 rounded-md bg-[#7D4EE4]'
                                            onClick={() => {
                                                setEndDateOpen(false);
                                            }}
                                        >확인</button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    

                </div>
            </div>
        </>
    );
};