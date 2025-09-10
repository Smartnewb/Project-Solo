'use client'

import { useState, useEffect } from 'react'
import { salesService } from '@/app/services/sales';
import { paymentType, UniversityRanking } from '../types';
import { Tally1 } from 'lucide-react';
import { ClassNames } from '@emotion/react';
import { format } from 'path';

// MARK: - props
interface RankingByUnivProps {
    startDate?: Date;
    endDate?: Date;
}


export function RankingByUniv ({startDate, endDate} : RankingByUnivProps) {
    // === 상태관리 ===
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedPaymentType, setSelectedPaymentType] = useState<paymentType>('all');
    const [totalData, setTotalData] = useState<UniversityRanking | null>(null);

    /// MARK: - 페이지네이션
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(50);
    const [totalItems, setTotalItems] = useState<number>(0); // 전체 항목
    const [totalPages, setTotalPages] = useState<number>(0); // 전체 페이지 수

    // MARK: - 자동 새로고침
    const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
    const [refreshInterval, setRefreshInterval] = useState<number>(5);
    const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

    // === 기본 날짜 범위 계산 ===
    const getDefaultDateRange = () => {
        const today = new Date();
        const serviceStartDate = new Date('2019-01-01'); // 서비스 시작일
        return { start: serviceStartDate, end: today };
    };

    // === 실제 사용할 날짜 계산 ===
    const getEffectiveDates = () => {
        if (startDate && endDate) {
            return { start: startDate, end: endDate };
        }
        return getDefaultDateRange();
    };

    // === API ===
    const fetchRankingData =  async () => {
        const { start, end } = getEffectiveDates();
        
        setIsLoading(true);

        const startDateString = formateDateToString(start);
        const endDateString = formateDateToString(end);
        console.log('대학 순위 startDate:',startDateString);
        console.log('대학 순위 endDate:',endDateString)

        try {
            const response = await salesService.getUniversityRank({
                startDate: startDateString,
                endDate: endDateString,
                paymentType: selectedPaymentType !== 'all' ? selectedPaymentType : 'all',
            });

            if (response) {
                setTotalData(response);
            } else {
                console.log('대학 랭킹 데이터 없음');
                setTotalData(null);
            }
        } catch(error) {
            setTotalData(null);
        }finally {
            setIsLoading(false)
        }

    };

    // === utils ===
    // MARK: - 날짜 포맷팅
    // TODO: - 유틸로 따로 빼기
    const formateDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2,'0');
        const day = String(date.getDate()).padStart(2,'0');
        return `${year}-${month}-${day}`;
    };

    // === hooks ===
    // MARK: - 마운트
    useEffect(()=>{
        fetchRankingData();
    },[]);

    // MARK: - 자동 랭킹 새로고침
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchRankingData();
            setLastUpdated(new Date());
        }, refreshInterval * 60 * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    // MARK: - 페이지 변경 감지
    useEffect(()=>{
        if (currentPage > 1) {
            fetchRankingData();
        }
    },[currentPage]);

    // MARK: - 날짜 변경 감지
    useEffect(() => {
        fetchRankingData();
    },[startDate, endDate]);



    // === handler === 
    
    const handlePageChange =  (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        if (newPage === currentPage) return;
        setCurrentPage(newPage);
    };

    const handleAutoRefresh = () => {
        setAutoRefresh(!autoRefresh);
    };

    const handleRefrehIntervalChange = (interval: number) => {
        setRefreshInterval(interval);
    };


    // === JSX ===
    return (
        <>
            {/* MARK: - 전체 컨테이너 */}
            <div className='border border-border bg-white rounded-md'>
                {/* MARK: - 메인 컨텐츠 */}
                <div>
                    <table className='w-full'>
                        {/* 테이블 헤더 */}
                        <thead className='bg-gray-50'>
                            <tr>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>순위</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>대학명</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>매출</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>결제건수</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>평균매출</th>
                            </tr>
                        </thead>

                        {/* 테이블 바디 */}
                        <tbody className='bg-white divide-y divide-gray-200'>
                            {totalData?.rankings.map((item, index) => (
                                <tr key={index} className='hover:bg-gray-50'>
                                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>{item.rank}</td> 
                                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>{item.universityName}</td>
                                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>{item.amount}</td>
                                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>{item.count}</td>
                                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>{item.averageAmount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MARK: - 푸터(페이지 버튼) */}
                <div></div>
            </div>
        </>
    );
}