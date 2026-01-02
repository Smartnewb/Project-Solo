// TITLE: - 결제수단별 상세 분석
'use client'

import { useEffect, useState } from 'react';
import { PaymentAnalysis as PaymentAnalysisType } from '../types';
import { salesService } from '@/app/services/sales';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { getPaymentTypeLabel } from '../constants/paymentTypes';
import Image from 'next/image';

interface PaymentAnalysisProps {
    startDate?: Date;
    endDate?: Date;
}

export function PaymentAnalysis({ startDate, endDate }: PaymentAnalysisProps) {
    // === 상태관리 ===
    const [paymentData, setPaymentData] = useState<PaymentAnalysisType | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [sortBy, setSortBy] = useState<'amount' | 'count' | 'percentage'>('amount');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showNetAmount, setShowNetAmount] = useState<boolean>(false);

    // === 기본 날짜 범위 계산 ===
    const getDefaultDateRange = () => {
        const today = new Date();
        // 전체 기간: 충분히 과거 날짜부터 오늘까지
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

    // === 날짜 포맷팅 유틸리티 ===
    const formatDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // === hooks ===
    useEffect(() => {
        const { start, end } = getEffectiveDates();
        fetchPaymentAnalysis(start, end);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchPaymentAnalysis(startDate, endDate);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (paymentData?.analysis) {
            handleSortData();
        }
    }, [sortBy, sortOrder]);

    // === handlers ===
    const fetchPaymentAnalysis = async (start?: Date, end?: Date) => {
        const { start: effectiveStart, end: effectiveEnd } = start && end 
            ? { start, end } 
            : getEffectiveDates();

        setIsLoading(true);
        setError('');

        try {
            const startDateString = formatDateToString(effectiveStart);
            const endDateString = formatDateToString(effectiveEnd);
            
            console.log('API 요청 날짜:', { startDateString, endDateString });

            const response = await salesService.getPaymentAnalysis({
                startDate: startDateString,
                endDate: endDateString,
            });
            setPaymentData(response);
        } catch (error) {
            console.error('결제수단별 분석 조회 실패:', error);
            setError('결제수단별 분석 데이터를 불러오는데 실패했습니다.');
            setPaymentData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (column: 'amount' | 'count' | 'percentage') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const handleSortData = () => {
        if (!paymentData?.analysis) return;
        const sortedData = [...paymentData.analysis].sort((a, b) => {
            let aValue: number, bValue: number;
            switch (sortBy) {
                case 'amount': aValue = a.totalAmount; bValue = b.totalAmount; break;
                case 'count': aValue = a.count; bValue = b.count; break;
                case 'percentage': aValue = a.percentage; bValue = b.percentage; break;
                default: return 0;
            }
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        });
        setPaymentData(prev => prev ? { ...prev, analysis: sortedData } : null);
    };

    const handleRefresh = () => {
        const { start, end } = getEffectiveDates();
        fetchPaymentAnalysis(start, end);
    };

    const getCurrentDateRangeText = () => {
        const { start, end } = getEffectiveDates();
        return `${start.toLocaleDateString('ko-KR')} ~ ${end.toLocaleDateString('ko-KR')}`;
    };

    const getAnalysisData = () => {
        if (!paymentData) return [];
        if (paymentData.data) {
            return paymentData.data.map(item => ({
                paymentType: item.method,
                totalAmount: item.amount,
                count: item.count,
                percentage: item.percentage,
                netAmount: undefined,
            }));
        }
        if (paymentData.analysis) {
            return paymentData.analysis;
        }
        return [];
    };

    const getPieChartData = () => {
        const analysisData = getAnalysisData();
        if (analysisData.length === 0) return [];
        return analysisData.map(item => ({
            name: getPaymentTypeName(item.paymentType),
            value: item.totalAmount,
            count: item.count,
            percentage: item.percentage,
            netAmount: item.netAmount,
            paymentType: item.paymentType,
        }));
    };

    const getChartColors = () => [
        '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', 
        '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'
    ];

    // === 유틸리티 ===
    const getPaymentTypeName = (type: string): string => {
        const typeMap: Record<string, string> = {
            'PG': 'WELCOME payment',
            'IAP': 'Apple 인앱 결제',
        };
        return typeMap[type] || type;
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency', currency: 'KRW',
        }).format(amount);
    };

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-medium">{data.name}</p>
                    <p style={{ color: payload[0].color }}>
                        금액: {formatCurrency(data.value)}
                        {data.paymentType === 'IAP' && data.netAmount && (
                            <span className="text-gray-600 text-sm block">
                                수수료 차감 후: {formatCurrency(data.netAmount)}
                            </span>
                        )}
                    </p>
                    <p style={{ color: payload[0].color }}>
                        건수: {formatNumber(data.count)}건
                    </p>
                    <p style={{ color: payload[0].color }}>
                        비율: {data.percentage.toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    // === 파이차트 렌더링 ===
    const renderPieChart = () => {
        const data = getPieChartData();
        const colors = getChartColors();

        return (
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    // === JSX ===
    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">결제수단별 상세 분석</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        조회 기간: {getCurrentDateRangeText()}
                        {!startDate || !endDate ? ' (기본값: 전체 기간)' : ''}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-[#7D4EE4] text-white rounded-lg hover:bg-purple-700"
                >
                    새로고침
                </button>
            </div>


            {/* 에러 메시지 */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* 로딩 상태 */}
            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">데이터를 불러오는 중...</span>
                </div>
            )}

            {/* 파이차트 영역 */}
            {!isLoading && paymentData && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium mb-4">
                        결제수단별 금액 분포
                    </h3>
                    {renderPieChart()}
                </div>
            )}

            {/* 데이터 테이블 */}
            {!isLoading && paymentData && getAnalysisData().length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium">결제수단별 상세 데이터</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        결제수단
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('amount')}
                                    >
                                        매출액 {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('count')}
                                    >
                                        건수 {sortBy === 'count' && (sortOrder === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('percentage')}
                                    >
                                        비율 {sortBy === 'percentage' && (sortOrder === 'desc' ? '↓' : '↑')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getAnalysisData().map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                {getPaymentTypeName(item.paymentType)}
                                                {item.paymentType === 'IAP' && (
                                                    <button
                                                        onClick={() => setShowNetAmount(!showNetAmount)}
                                                        className="hover:opacity-80 transition-opacity"
                                                        title="수수료 차감 금액 보기"
                                                    >
                                                        <Image
                                                            src="/miho.png"
                                                            alt="미호"
                                                            width={20}
                                                            height={20}
                                                            className="cursor-pointer"
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(item.totalAmount)}
                                            {item.paymentType === 'IAP' && showNetAmount && item.netAmount && (
                                                <span className="text-gray-600 ml-2">
                                                    ({formatCurrency(item.netAmount)})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatNumber(item.count)}건
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.percentage.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        총계
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">
                                        {formatCurrency(paymentData?.totalAmount || 0)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {formatNumber(paymentData?.totalCount || 0)}건
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                                        100.0%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* 데이터 없음 */}
            {!isLoading && !paymentData && !error && (
                <div className="text-center py-12 text-gray-500">
                    기간을 선택하여 결제수단별 분석을 확인하세요.
                </div>
            )}
        </div>
    );
}
