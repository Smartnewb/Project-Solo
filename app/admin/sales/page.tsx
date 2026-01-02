'use client';

import { useState } from 'react';
import { PaymentAnalysis } from './components/PaymentAnalysis';
import { PeriodSelector } from './components/PeriodSelector';
import { TotalAmount } from './components/TotalAmount';
import { RankingByUniv } from './components/RankingByUniv';
import { GenderAnalysisTable } from './components/GenderAnalysis';
import { AgeAnalysisComponent } from './components/AgeAnalysis';
import { MonthlyPaymentGraph } from './components/MonthlyPaymentGraph';
import { DailySalesTrendGraph } from './components/DailySalesTrendGraph';
import { SuccessRate } from './components/SuccessRate';

// 타입 정의
interface DateRange {
    startDate: Date | undefined;
    endDate: Date | undefined;
}

// 매출 추이 탭 타입
type SalesTrendTab = 'monthly' | 'daily';

export default function SalesPage() {
    // === 상태 관리 ===
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: undefined,
        endDate: undefined,
    });
    const [salesTrendTab, setSalesTrendTab] = useState<SalesTrendTab>('monthly');

    // === 핸들러 ===
    const handleDateRangeChange = (range: DateRange) => {
        setDateRange(range);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* MARK: - 헤더 영역 */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">매출 관리</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                매출 현황과 결제수단별 분석을 확인하세요
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="bg-purple-50 px-3 py-1 rounded-full">
                                <span className="text-purple-700 text-sm font-medium">실시간 데이터</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MARK: - 메인 컨텐츠 영역 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">

                    {/* MARK: - 매출 추이 그래프 (탭 전환) */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* 탭 헤더 */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">매출 추이</h2>
                                    <p className="text-sm text-gray-500 mt-1">기간별 매출 추이를 확인하세요</p>
                                </div>
                                {/* 탭 버튼 */}
                                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setSalesTrendTab('monthly')}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            salesTrendTab === 'monthly'
                                                ? 'bg-white text-purple-700 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        월별
                                    </button>
                                    <button
                                        onClick={() => setSalesTrendTab('daily')}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            salesTrendTab === 'daily'
                                                ? 'bg-white text-purple-700 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        일별
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 탭 콘텐츠 */}
                        <div>
                            {salesTrendTab === 'monthly' ? (
                                <MonthlyPaymentGraph />
                            ) : (
                                <DailySalesTrendGraph hideHeader />
                            )}
                        </div>
                    </div>

                    {/* MARK: - 결제 성공률 컴포넌트 */}
                    <SuccessRate />

                    {/* MARK: - 기간 선택 컴포넌트 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">조회 기간 설정</h2>
                            <p className="text-sm text-gray-500 mt-1">분석할 기간을 선택하세요</p>
                        </div>
                        <div className="p-6">
                            <PeriodSelector onDateRangeChange={handleDateRangeChange} />
                        </div>
                    </div>

                    {/* MARK: - 매출액 분석 컴포넌트 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">매출 지표 상세 분석</h2>
                            <p className="text-sm text-gray-500 mt-1">각 매출 지표별 상세 분석을 제공합니다.</p>
                        </div>
                        <div className="p-6">
                            <TotalAmount 
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                            />
                        </div>
                    </div>

                    {/* MARK: - 결제수단별 분석 컴포넌트 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">결제수단별 상세 분석</h2>
                            <p className="text-sm text-gray-500 mt-1">결제수단별 매출 분포와 통계를 분석하세요</p>
                        </div>
                        <div className="p-6">
                            <PaymentAnalysis 
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                            />
                        </div>
                    </div>

                    {/* MARK: - 대학별 매출 순위 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">대학별 매출 순위</h2>
                            <p className="text-sm text-gray-500 mt-1">대학별 매출 순위를 확인하세요</p>
                        </div>
                        <div className="p-6">
                            <RankingByUniv 
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                            />
                        </div>
                    </div>

                    
                    <div className='flex gap-2'>
                        {/* 성별 분석 */} 
                        <div className='flex-1'>
                            <GenderAnalysisTable
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                            />
                        </div>
                        {/* 연령대별 분석 */} 
                        <div className='flex-1'>
                            <AgeAnalysisComponent 
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
