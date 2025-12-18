'use client';

import { useState, useEffect, useMemo } from "react";
import { salesService } from '@/app/services/sales';
import { paymentType } from "../types";
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { formatCurrency, formateDateToString } from "../utils";
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar } from '@/shared/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/shared/ui/popover';

// === 컴포넌트 Props ===
interface DailySalesTrendGraphProps {
    className?: string;
    hideHeader?: boolean;  // 부모에서 헤더를 제공할 경우 숨김
}

// === 차트 데이터 타입 ===
interface DailyChartData {
    date: string;           // 원본 날짜 (YYYY-MM-DD)
    displayDate: string;    // 표시용 날짜 (M/D)
    amount: number;         // 총 매출액
    count: number;          // 결제 건수
    paidUserCount: number;  // 유료 사용자 수
    // paymentType="all"일 때
    pgAmount: number;       // PG 매출액
    pgCount: number;        // PG 결제 건수
    iapAmount: number;      // 인앱 매출액
    iapCount: number;       // 인앱 결제 건수
    iapNetAmount: number;   // 인앱 순매출
}

// === 합계 타입 ===
interface TotalSummary {
    totalAmount: number;
    totalCount: number;
    totalPaidUsers: number;
    pgTotalAmount: number;
    iapTotalAmount: number;
}

export function DailySalesTrendGraph({ className, hideHeader = false }: DailySalesTrendGraphProps) {
    // === 상태 관리 ===
    const [chartData, setChartData] = useState<DailyChartData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // 날짜 범위 상태
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [startDateOpen, setStartDateOpen] = useState<boolean>(false);
    const [endDateOpen, setEndDateOpen] = useState<boolean>(false);

    // 필터 상태
    const [selectedPaymentType, setSelectedPaymentType] = useState<paymentType>('exclude_iap');

    // === 유틸리티 함수 ===
    const formatDateLabel = (dateStr: string): string => {
        // "2025-01-28" -> "1/28"
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            return `${month}/${day}`;
        }
        return dateStr;
    };

    // === 기간 경고 확인 (90일 초과) ===
    const periodWarning = useMemo(() => {
        if (startDate && endDate) {
            const days = differenceInDays(endDate, startDate);
            if (days > 90) {
                return `선택한 기간이 ${days}일입니다. 90일 이하로 설정하는 것을 권장합니다.`;
            }
        }
        return null;
    }, [startDate, endDate]);

    // === 합계 계산 ===
    const totalSummary = useMemo<TotalSummary>(() => {
        return chartData.reduce((acc, item) => ({
            totalAmount: acc.totalAmount + item.amount,
            totalCount: acc.totalCount + item.count,
            totalPaidUsers: acc.totalPaidUsers + item.paidUserCount,
            pgTotalAmount: acc.pgTotalAmount + item.pgAmount,
            iapTotalAmount: acc.iapTotalAmount + item.iapAmount,
        }), {
            totalAmount: 0,
            totalCount: 0,
            totalPaidUsers: 0,
            pgTotalAmount: 0,
            iapTotalAmount: 0,
        });
    }, [chartData]);

    // === API 호출 ===
    const fetchDailySalesTrend = async () => {
        if (!startDate || !endDate) {
            return;
        }

        // 날짜 유효성 검사
        if (startDate > endDate) {
            setError('시작일은 종료일보다 이전이어야 합니다.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await salesService.getTrendCustom({
                startDate: formateDateToString(startDate),
                endDate: formateDateToString(endDate),
                paymentType: selectedPaymentType,
                byRegion: false,
            });

            if (response.data && response.data.length > 0) {
                const transformedData: DailyChartData[] = response.data.map(item => ({
                    date: item.label,
                    displayDate: formatDateLabel(item.label),
                    amount: item.amount,
                    count: item.count,
                    paidUserCount: item.paidUserCount,
                    pgAmount: item.excludeIapAmount || 0,
                    pgCount: item.excludeIapCount || 0,
                    iapAmount: item.iapOnlyAmount || 0,
                    iapCount: item.iapOnlyCount || 0,
                    iapNetAmount: (item as any).iapOnlyNetAmount || 0,
                }));

                setChartData(transformedData);
            } else {
                setChartData([]);
            }
        } catch (err) {
            console.error('일별 매출 추이 조회 실패:', err);
            setError('매출 데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
            setChartData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // === 빠른 기간 설정 핸들러 ===
    const handleQuickPeriod = (days: number) => {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - days);

        setStartDate(start);
        setEndDate(today);
    };

    // === 조회 버튼 핸들러 ===
    const handleSearch = () => {
        fetchDailySalesTrend();
    };

    // === 커스텀 툴팁 ===
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as DailyChartData;

            return (
                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg min-w-[200px]">
                    <p className="font-medium text-gray-900 mb-2">{data.date}</p>

                    {selectedPaymentType === 'all' ? (
                        <>
                            <p className="text-blue-600">
                                PG 결제: {formatCurrency(data.pgAmount)} ({data.pgCount}건)
                            </p>
                            <p className="text-green-600">
                                인앱 결제: {formatCurrency(data.iapAmount)} ({data.iapCount}건)
                            </p>
                            <div className="border-t mt-2 pt-2">
                                <p className="font-semibold text-gray-900">
                                    총 매출: {formatCurrency(data.amount)}
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-purple-600">
                            매출: {formatCurrency(data.amount)}
                        </p>
                    )}

                    <p className="text-gray-600 text-sm mt-1">
                        결제 건수: {data.count}건
                    </p>
                    <p className="text-orange-600 text-sm">
                        유료 사용자: {data.paidUserCount}명
                    </p>
                    {data.paidUserCount > 0 && (
                        <p className="text-blue-500 text-sm">
                            사용자당 평균: {formatCurrency(Math.round(data.amount / data.paidUserCount))}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // === 초기 설정 (최근 30일) ===
    useEffect(() => {
        handleQuickPeriod(30);
    }, []);

    // === 초기 데이터 로드 ===
    useEffect(() => {
        if (startDate && endDate) {
            fetchDailySalesTrend();
        }
    }, []);

    // === JSX ===
    return (
        <div className={`bg-white ${hideHeader ? '' : 'rounded-lg border border-gray-200'} ${className || ''}`}>
            {/* MARK: - 헤더 (hideHeader가 false일 때만 표시) */}
            {!hideHeader && (
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">일별 매출 추이</h2>
                    <p className="text-sm text-gray-500 mt-1">조회 기간 내 일별 매출 추이를 확인하세요</p>
                </div>
            )}

            {/* MARK: - 필터 영역 */}
            <div className="px-6 py-4 border-b border-gray-100 space-y-4">
                {/* 빠른 기간 선택 */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleQuickPeriod(7)}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        최근 7일
                    </button>
                    <button
                        onClick={() => handleQuickPeriod(30)}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        최근 30일
                    </button>
                    <button
                        onClick={() => handleQuickPeriod(60)}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        최근 60일
                    </button>
                    <button
                        onClick={() => handleQuickPeriod(90)}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        최근 90일
                    </button>
                </div>

                {/* 날짜 선택기 + 조회 버튼 */}
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    {/* 시작일 */}
                    <div className="flex-1 w-full sm:max-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                            <PopoverTrigger asChild>
                                <button className={`w-full flex px-3 py-2 text-left border rounded-md text-sm items-center justify-between
                                    ${startDateOpen ? 'border-purple-500' : 'border-gray-300'}`}
                                >
                                    <span className={startDate ? 'text-gray-900' : 'text-gray-400'}>
                                        {startDate ? format(startDate, 'yyyy-MM-dd') : '시작일 선택'}
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                                        <path d="M3 1V2H1.5C0.671875 2 0 2.67188 0 3.5V5H14V3.5C14 2.67188 13.3281 2 12.5 2H11V1C11 0.446875 10.5531 0 10 0C9.44687 0 9 0.446875 9 1V2H5V1C5 0.446875 4.55312 0 4 0C3.44688 0 3 0.446875 3 1ZM14 6H0V14.5C0 15.3281 0.671875 16 1.5 16H12.5C13.3281 16 14 15.3281 14 14.5V6Z" fill="#9CA3AF"/>
                                    </svg>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => {
                                        setStartDate(date);
                                        setStartDateOpen(false);
                                    }}
                                    locale={ko}
                                    autoFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <span className="hidden sm:block text-gray-400 pb-2">~</span>

                    {/* 종료일 */}
                    <div className="flex-1 w-full sm:max-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                            <PopoverTrigger asChild>
                                <button className={`w-full flex px-3 py-2 text-left border rounded-md text-sm items-center justify-between
                                    ${endDateOpen ? 'border-purple-500' : 'border-gray-300'}`}
                                >
                                    <span className={endDate ? 'text-gray-900' : 'text-gray-400'}>
                                        {endDate ? format(endDate, 'yyyy-MM-dd') : '종료일 선택'}
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="16" viewBox="0 0 14 16" fill="none">
                                        <path d="M3 1V2H1.5C0.671875 2 0 2.67188 0 3.5V5H14V3.5C14 2.67188 13.3281 2 12.5 2H11V1C11 0.446875 10.5531 0 10 0C9.44687 0 9 0.446875 9 1V2H5V1C5 0.446875 4.55312 0 4 0C3.44688 0 3 0.446875 3 1ZM14 6H0V14.5C0 15.3281 0.671875 16 1.5 16H12.5C13.3281 16 14 15.3281 14 14.5V6Z" fill="#9CA3AF"/>
                                    </svg>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(date) => {
                                        setEndDate(date);
                                        setEndDateOpen(false);
                                    }}
                                    locale={ko}
                                    disabled={(date) => startDate ? date < startDate : false}
                                    autoFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* 조회 버튼 */}
                    <button
                        onClick={handleSearch}
                        disabled={!startDate || !endDate || isLoading}
                        className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? '조회 중...' : '조회'}
                    </button>
                </div>

                {/* 결제 타입 필터 */}
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">결제 타입:</span>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="paymentType"
                                value="exclude_iap"
                                checked={selectedPaymentType === 'exclude_iap'}
                                onChange={(e) => setSelectedPaymentType(e.target.value as paymentType)}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">PG 결제만</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="paymentType"
                                value="iap_only"
                                checked={selectedPaymentType === 'iap_only'}
                                onChange={(e) => setSelectedPaymentType(e.target.value as paymentType)}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">인앱 결제만</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="paymentType"
                                value="all"
                                checked={selectedPaymentType === 'all'}
                                onChange={(e) => setSelectedPaymentType(e.target.value as paymentType)}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">전체 (분리 표시)</span>
                        </label>
                    </div>
                </div>

                {/* 기간 경고 메시지 */}
                {periodWarning && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-700">{periodWarning}</p>
                    </div>
                )}
            </div>

            {/* MARK: - 차트 영역 */}
            <div className="px-6 py-4">
                {/* 로딩 상태 */}
                {isLoading && (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-3 text-gray-600">데이터를 불러오는 중...</span>
                    </div>
                )}

                {/* 에러 상태 */}
                {!isLoading && error && (
                    <div className="text-center py-16">
                        <div className="text-red-500 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600">{error}</p>
                        <button
                            onClick={handleSearch}
                            className="mt-4 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {/* 데이터 없음 */}
                {!isLoading && !error && chartData.length === 0 && startDate && endDate && (
                    <div className="text-center py-16 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>해당 기간에 매출 데이터가 없습니다.</p>
                    </div>
                )}

                {/* 초기 안내 메시지 */}
                {!isLoading && !error && chartData.length === 0 && (!startDate || !endDate) && (
                    <div className="text-center py-16 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>조회 기간을 선택한 후 조회 버튼을 클릭하세요.</p>
                    </div>
                )}

                {/* 차트 */}
                {!isLoading && !error && chartData.length > 0 && (
                    <div className="h-[420px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {selectedPaymentType === 'all' ? (
                                // 전체 선택 시: PG와 인앱을 분리하여 표시
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="displayDate"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="amount"
                                        orientation="left"
                                        tickFormatter={(value) => formatCurrency(value)}
                                        tick={{ fontSize: 11 }}
                                        width={80}
                                    />
                                    <YAxis
                                        yAxisId="count"
                                        orientation="right"
                                        tickFormatter={(value) => `${value}건`}
                                        tick={{ fontSize: 11 }}
                                        width={50}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />

                                    {/* PG 매출 라인 */}
                                    <Line
                                        yAxisId="amount"
                                        type="monotone"
                                        dataKey="pgAmount"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        name="PG 결제"
                                        dot={{ fill: '#3B82F6', strokeWidth: 1, r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />

                                    {/* 인앱 매출 라인 */}
                                    <Line
                                        yAxisId="amount"
                                        type="monotone"
                                        dataKey="iapAmount"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        name="인앱 결제"
                                        dot={{ fill: '#10B981', strokeWidth: 1, r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />

                                    {/* 총 건수 라인 */}
                                    <Line
                                        yAxisId="count"
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#F59E0B"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="결제 건수"
                                        dot={false}
                                    />
                                </ComposedChart>
                            ) : (
                                // 단일 결제 타입 선택 시
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="displayDate"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="amount"
                                        orientation="left"
                                        tickFormatter={(value) => formatCurrency(value)}
                                        tick={{ fontSize: 11 }}
                                        width={80}
                                    />
                                    <YAxis
                                        yAxisId="count"
                                        orientation="right"
                                        tickFormatter={(value) => `${value}건`}
                                        tick={{ fontSize: 11 }}
                                        width={50}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />

                                    {/* 매출 영역 그래프 */}
                                    <Bar
                                        yAxisId="amount"
                                        dataKey="amount"
                                        fill="#8B5CF6"
                                        name="매출액"
                                        radius={[4, 4, 0, 0]}
                                        fillOpacity={0.8}
                                    />

                                    {/* 결제 건수 라인 */}
                                    <Line
                                        yAxisId="count"
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#F59E0B"
                                        strokeWidth={2}
                                        name="결제 건수"
                                        dot={{ fill: '#F59E0B', strokeWidth: 1, r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />

                                    {/* 유료 사용자 라인 */}
                                    <Line
                                        yAxisId="count"
                                        type="monotone"
                                        dataKey="paidUserCount"
                                        stroke="#EF4444"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="유료 사용자"
                                        dot={false}
                                    />
                                </ComposedChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* MARK: - 합계 영역 */}
            {!isLoading && !error && chartData.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-6">
                            <div>
                                <span className="text-sm text-gray-500">총 매출</span>
                                <p className="text-xl font-bold text-purple-600">
                                    {formatCurrency(totalSummary.totalAmount)}
                                </p>
                            </div>
                            {selectedPaymentType === 'all' && (
                                <>
                                    <div>
                                        <span className="text-sm text-gray-500">PG 매출</span>
                                        <p className="text-lg font-semibold text-blue-600">
                                            {formatCurrency(totalSummary.pgTotalAmount)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">인앱 매출</span>
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(totalSummary.iapTotalAmount)}
                                        </p>
                                    </div>
                                </>
                            )}
                            <div>
                                <span className="text-sm text-gray-500">결제 건수</span>
                                <p className="text-lg font-semibold text-gray-900">
                                    {totalSummary.totalCount.toLocaleString()}건
                                </p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">유료 사용자</span>
                                <p className="text-lg font-semibold text-orange-600">
                                    {totalSummary.totalPaidUsers.toLocaleString()}명
                                </p>
                            </div>
                        </div>

                        {/* 조회 기간 표시 */}
                        {startDate && endDate && (
                            <div className="text-sm text-gray-500">
                                조회 기간: {format(startDate, 'yyyy-MM-dd')} ~ {format(endDate, 'yyyy-MM-dd')}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
