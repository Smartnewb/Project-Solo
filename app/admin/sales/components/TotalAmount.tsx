'use client';

import { useEffect, useState } from 'react';
import { salesService } from '@/app/services/sales';
import { CustomSalesResponse } from '../types';
import { paymentType } from '../types';
import { REGION_OPTIONS, getRegionLabel } from '../constants/regions';
import { PAYMENT_TYPE_OPTIONS, getPaymentTypeLabel } from '../constants/paymentTypes';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../utils';

interface TotalAmountProps {
    startDate?: Date;
    endDate?: Date;
}

export function TotalAmount({ startDate, endDate }: TotalAmountProps) {
    // === 상태 관리 ===
    const [totalData, setTotalData] = useState<CustomSalesResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    
    // 필터 상태
    const [selectedRegions, setSelectedRegions] = useState<string[]>(['all']);
    const [selectedPaymentType, setSelectedPaymentType] = useState<paymentType>('all');

    // === 기본 날짜 범위 계산 개선 ===
    const getDefaultDateRange = () => {
        const today = new Date();
        // 서비스 시작일을 더 과거로 설정 (또는 null로 전체 기간 조회)
        const serviceStartDate = new Date('2019-01-01'); // 충분히 과거 날짜
        return { start: serviceStartDate, end: today };
    };

    // === 실제 사용할 날짜 계산 개선 ===
    const getEffectiveDates = () => {
        if (startDate && endDate) {
            return { start: startDate, end: endDate };
        }
        // startDate, endDate가 없으면 전체 기간으로 조회
        return getDefaultDateRange();
    };

    // === 날짜 포맷팅 유틸리티 개선 ===
    const formatDateToString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    // === hooks ===
    useEffect(() => {
        fetchTotalSales();
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchTotalSales();
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchTotalSales();
    }, [selectedPaymentType]); // 지역 필터는 제거 - 프론트엔드에서만 필터링

    // === handlers 수정 ===
    const fetchTotalSales = async () => {
        setIsLoading(true);
        setError('');

        try {
            const { start, end } = getEffectiveDates();
            const startDateString = formatDateToString(start);
            const endDateString = formatDateToString(end);

            console.log('총 매출액 API 요청:', {
                startDate: startDateString,
                endDate: endDateString,
                paymentType: selectedPaymentType !== 'all' ? selectedPaymentType : 'all',
                byRegion: true,
                isFullPeriod: !startDate && !endDate // 전체 기간 여부 표시
            });

            const response = await salesService.getSalesCustom({
                startDate: startDateString,
                endDate: endDateString,
                paymentType: selectedPaymentType !== 'all' ? selectedPaymentType : 'all',
                byRegion: true
            });

            console.log('총 매출액 API 응답:', response);
            console.log('필터 상태:', { selectedRegions, selectedPaymentType });
            
            if (response) {
                setTotalData(response);
            } else {
                console.warn('API 응답이 비어있습니다.');
                setError('매출 데이터를 불러올 수 없습니다.');
                setTotalData(null);
            }
        } catch (error) {
            console.error('총 매출액 조회 실패:', error);
            setError('총 매출액 데이터를 불러오는데 실패했습니다.');
            setTotalData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchTotalSales();
    };

    const getCurrentDateRangeText = () => {
        if (startDate && endDate) {
            return `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;
        }
        // 전체 기간일 때는 실제 데이터 범위 표시
        if (totalData && totalData.startDate && totalData.endDate) {
            const apiStartDate = new Date(totalData.startDate);
            const apiEndDate = new Date(totalData.endDate);
            return `${apiStartDate.toLocaleDateString('ko-KR')} ~ ${apiEndDate.toLocaleDateString('ko-KR')} (전체 기간)`;
        }
        return '전체 기간 (서비스 시작일 ~ 오늘)';
    };

    // 지역별 필터링된 총합 계산 함수
    const getFilteredTotals = () => {
        console.log('getFilteredTotals 호출:', { totalData, selectedRegions });
        
        if (!totalData) {
            console.log('totalData가 없음');
            return { totalSales: 0, totalCount: 0 };
        }

        // 전체 지역 선택 시 원본 데이터 반환
        if (selectedRegions.includes('all') || selectedRegions.length === 0) {
            const result = {
                totalSales: totalData.totalSales || 0,
                totalCount: totalData.totalCount || 0
            };
            console.log('전체 지역 선택 결과:', result);
            return result;
        }

        // 특정 지역들 선택 시 해당 지역들 데이터 합계
        if (totalData.regionalData && totalData.regionalData.length > 0) {
            const filteredRegionData = totalData.regionalData.filter(item => 
                selectedRegions.includes(item.region)
            );
            console.log('선택된 지역들 데이터:', filteredRegionData);
            
            if (filteredRegionData.length > 0) {
                const result = filteredRegionData.reduce(
                    (acc, regionData) => ({
                        totalSales: acc.totalSales + (regionData.amount || 0),
                        totalCount: acc.totalCount + (regionData.count || 0)
                    }),
                    { totalSales: 0, totalCount: 0 }
                );
                console.log('다중 지역 선택 결과:', result);
                return result;
            }
        }

        // 선택된 지역 데이터가 없는 경우
        console.log('선택된 지역 데이터 없음');
        return { totalSales: 0, totalCount: 0 };
    };

    // === 비율 계산 유틸리티 ===
    const calculatePercentages = () => {
        if (!totalData?.regionalData || totalData.regionalData.length === 0 || (totalData.totalSales || 0) <= 0) {
            return {};
        }

        const totalSales = totalData.totalSales || 0;
        const percentages = totalData.regionalData.map(regionData => 
            ((regionData.amount || 0) / totalSales * 100)
        );

        // 반올림된 비율들 계산
        const roundedPercentages = percentages.map(p => Math.round(p * 10) / 10);
        const totalRounded = roundedPercentages.reduce((sum, p) => sum + p, 0);

        // 100.0%에서 벗어나면 가장 큰 값에 오차 보정
        if (Math.abs(totalRounded - 100) > 0.05 && roundedPercentages.length > 0) {
            const maxIndex = percentages.reduce((maxIdx, current, index) => 
                current > percentages[maxIdx] ? index : maxIdx, 0
            );
            roundedPercentages[maxIndex] = Math.round((roundedPercentages[maxIndex] + (100 - totalRounded)) * 10) / 10;
        }

        // 지역별 비율 맵 생성
        const percentageMap: { [key: string]: number } = {};
        totalData.regionalData.forEach((regionData, index) => {
            percentageMap[regionData.region] = roundedPercentages[index];
        });

        return percentageMap;
    };

    // === 파이차트 관련 유틸리티 ===
    const getPieChartData = () => {
        if (!totalData?.regionalData || totalData.regionalData.length === 0) {
            return [];
        }

        // 선택된 지역들이 있으면 해당 지역들만, 전체 선택이면 모든 지역
        const filteredRegionalData = selectedRegions.includes('all') 
            ? totalData.regionalData
            : totalData.regionalData.filter(regionData => selectedRegions.includes(regionData.region));

        if (filteredRegionalData.length === 0) {
            return [];
        }

        // 필터링된 데이터의 총합 계산
        const filteredTotal = filteredRegionalData.reduce((sum, item) => sum + (item.amount || 0), 0);

        const percentageMap = calculatePercentages();

        return filteredRegionalData.map((regionData) => ({
            name: getRegionLabel(regionData.region),
            value: regionData.amount || 0,
            count: regionData.count || 0,
            region: regionData.region,
            percentage: selectedRegions.includes('all') 
                ? (percentageMap[regionData.region] || 0)
                : ((regionData.amount || 0) / filteredTotal * 100) // 다중 지역 선택 시 필터된 총액 기준 비율
        }));
    };

    // 차트 색상 배열
    const getChartColors = () => [
        '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', 
        '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb',
        '#dda0dd', '#98fb98', '#f0e68c', '#ff6347'
    ];

    // 커스텀 툴팁 컴포넌트
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-medium text-gray-900">{data.name}</p>
                    <p className="text-blue-600">
                        매출액: {formatCurrency(data.value)}
                    </p>
                    <p className="text-green-600">
                        거래건수: {formatNumber(data.count)}건
                    </p>
                    <p className="text-purple-600">
                        비율: {data.percentage.toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    // === 파이차트 렌더링 함수 ===
    const renderSalesPieChart = () => {
        const data = getPieChartData();
        const colors = getChartColors();

        if (data.length === 0) {
            return (
                <div className="flex items-center justify-center h-80 text-gray-500">
                    표시할 지역별 데이터가 없습니다.
                </div>
            );
        }

        return (
            <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
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
                    <h2 className="text-lg font-semibold">총 매출액</h2>
                </div>
                <div className="flex gap-2">
                    
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        새로고침
                    </button>
                </div>
            </div>


            {/* 필터 영역 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* 지역별 필터 */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">지역별</label>
                        <div className="flex flex-wrap gap-2">
                            {REGION_OPTIONS.map(option => (
                                <label key={option.value} className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedRegions.includes(option.value)}
                                        onChange={(e) => {
                                            if (option.value === 'all') {
                                                // 전체 선택/해제
                                                if (e.target.checked) {
                                                    setSelectedRegions(['all']);
                                                } else {
                                                    setSelectedRegions([]);
                                                }
                                            } else {
                                                // 개별 지역 선택/해제
                                                setSelectedRegions(prev => {
                                                    const newRegions = prev.filter(r => r !== 'all'); // 전체 제거
                                                    if (e.target.checked) {
                                                        return [...newRegions, option.value];
                                                    } else {
                                                        return newRegions.filter(r => r !== option.value);
                                                    }
                                                });
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 결제 타입별 필터 */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">결제 타입별</label>
                        <select
                            value={selectedPaymentType}
                            onChange={(e) => setSelectedPaymentType(e.target.value as paymentType)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {PAYMENT_TYPE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
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

            {/* 총 매출액 표시 */}
            {!isLoading && totalData && (
                <div className="bg-white p-8 rounded-lg border border-gray-200">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                            {selectedRegions.includes('all') || selectedRegions.length === 0 
                                ? '총 매출액' 
                                : selectedRegions.length === 1 
                                    ? `${getRegionLabel(selectedRegions[0])} 매출액`
                                    : `선택된 지역 (${selectedRegions.length}개) 매출액`
                            }
                        </h3>
                        <div className="text-4xl font-bold text-purple-600 mb-4">
                            {formatCurrency(getFilteredTotals().totalSales)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-500">총 거래 건수</div>
                                <div className="text-xl font-semibold text-gray-900">
                                    {formatNumber(getFilteredTotals().totalCount)}건
                                </div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-500">지역 필터</div>
                                <div className="text-xl font-semibold text-gray-900">
                                    {selectedRegions.includes('all') || selectedRegions.length === 0 
                                        ? '전체' 
                                        : selectedRegions.length === 1 
                                            ? getRegionLabel(selectedRegions[0])
                                            : `${selectedRegions.length}개 지역`
                                    }
                                </div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-500">결제 타입</div>
                                <div className="text-xl font-semibold text-gray-900">
                                    {getPaymentTypeLabel(selectedPaymentType)}
                                </div>
                            </div>
                        </div>
                        
                        {/* 지역별 상세 데이터 표시 */}
                        {totalData.regionalData && totalData.regionalData.length > 0 && (
                            <div className="mt-8">
                                <h4 className="text-md font-medium text-gray-700 mb-6">지역별 상세 현황</h4>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* 매출액 파이차트 */}
                                    <div className="bg-white p-6 rounded-lg border border-border">
                                        <h5 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                                            지역별 매출액 분포
                                        </h5>
                                        {renderSalesPieChart()}
                                    </div>
                                    
                                    {/* MARK: - 지역별 상세 테이블 */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                            <h5 className="text-lg font-semibold text-gray-800">지역별 상세 통계</h5>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            지역
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            매출액
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            거래건수
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            비율
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {(() => {
                                                        const filteredData = selectedRegions.includes('all') 
                                                            ? totalData.regionalData
                                                            : totalData.regionalData.filter(item => selectedRegions.includes(item.region));
                                                        return filteredData.map((regionData) => (
                                                        <tr key={regionData.region} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {getRegionLabel(regionData.region)}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                <div className="text-sm font-semibold text-blue-900">
                                                                    {formatCurrency(regionData.amount || 0)}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                <div className="text-sm text-gray-900">
                                                                    {formatNumber(regionData.count || 0)}건
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                <div className="text-sm text-purple-600 font-medium">
                                                                    {(() => {
                                                                        const percentageMap = calculatePercentages();
                                                                        return `${(percentageMap[regionData.region] || 0).toFixed(1)}%`;
                                                                    })()}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        ));
                                                    })()}
                                                </tbody>
                                                <tfoot className="bg-gray-50">
                                                    <tr>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                            총계
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-900">
                                                            {formatCurrency(getFilteredTotals().totalSales)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                                            {formatNumber(getFilteredTotals().totalCount)}건
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                                                            100.0%
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* 데이터 없음 */}
            {!isLoading && !totalData && !error && (
                <div className="text-center py-12 text-gray-500">
                    조건에 맞는 매출 데이터가 없습니다.
                </div>
            )}
        </div>
    );
}
