'use client';

import { useState, useEffect } from 'react';
import { AgeAnalysis, paymentType } from '../types';
import { formateDateToString } from '../utils'
import { salesService } from '@/app/services/sales';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';


interface AgeAnalysisProps {
    startDate?: Date;
    endDate?: Date;
};

export function AgeAnalysisComponent({ startDate, endDate}: AgeAnalysisProps) {
    const [totalData, setTotalData] = useState<AgeAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedPaymentType, setSelectedPaymentType] = useState<paymentType>('all');

    // TODO: - 날짜 관련 utils로 분리
    const getDefaultDateRange = () => {
        const today = new Date();
        const serviceStartDate = new Date('2019-01-01');
        return { start: serviceStartDate, end: today};
    };

    const getEffectiveDates = () => {
        if (startDate && endDate) {
            return { start: startDate, end: endDate};
        }

        return getDefaultDateRange();
    };

    // === API ===
    const fetchAgeData = async (start?: Date, end?: Date) => {
        const { start: effectiveStart, end: effectiveEnd } = start && end 
        ? { start, end}
        : getEffectiveDates();

        setIsLoading(true);

        try {
            const startToString = formateDateToString(effectiveStart);
            const endToString = formateDateToString(effectiveEnd);

            const response = await salesService.getAgeAnalysis({
                paymentType: selectedPaymentType !== 'all' ? selectedPaymentType : 'all',
                startDate: startToString,
                endDate: endToString,
            });

            if (response) {
                setTotalData(response);
            } else {
                setTotalData(null);
            }
        } catch(error) {
            setTotalData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // === hooks ===
    // MARK: - 마운트
    useEffect(()=>{
        fetchAgeData();
    },[]);

    // MARK: - 날짜 변경 감지
    useEffect(()=>{
        fetchAgeData();
    },[startDate, endDate])

    // MARK: - 자동 새로고침
    // TODO: - 추후 구현

    // === utils ===
    // TODO: - utils 분리

    const getChartColors = () => [
        '#3B82F6', // blue-500
        '#10B981', // green-500
        '#8B5CF6', // purple-500
        '#F59E0B', // orange-500
        '#EC4899'  // pink-500
    ];
    const getPieChartData = () => {
        if(!totalData?.analysis) return [];
        return totalData.analysis.map(item => ({
            name: item.ageGroup,
            value: item.totalAmount,
            count: item.count,
            percentage: item.percentage,
        }))
    };
    // MARK: - 파이차트 렌더링
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
                                labelLine={false}
                                label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                                outerRadius={120}
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
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            };

    // === JSX ===
    return (
        <>
            {/* MARK: - 전체 컨테이너 */}
            <div className='bg-white border border-border px-6 py-6 gap-4 rounded-md h-[800px]'>
                {/* MARK: - 헤더 */}
                <div>
                    <h2 className='text-xl font-semibold'>연령대별 구매 비율</h2>
                </div>

                {/* MARK: - 메인 컨텐츠 */}
                <div className='flex flex-col gap-4'>
                    {!isLoading && totalData && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium mb-4">
                                성별 구매 비율
                            </h3>
                            {renderPieChart()}
                        </div>
                    )}
                    <div className='flex flex-col gap-2'>
                        {totalData?.analysis?.map((item, index) => {
                            const getAgeColor = (ageGroup: string) => {
                                const age = parseInt(ageGroup);
                                if (age < 22) return 'bg-blue-50 text-blue-700';
                                if (age < 24) return 'bg-green-50 text-green-700';
                                if (age < 30) return 'bg-purple-50 text-purple-700';
                                if (age < 50) return 'bg-orange-50 text-orange-700';
                                return 'bg-pink-50';
                            };
                            
                            return (
                                <div 
                                    key={index}
                                    className={`flex justify-between items-center rounded-lg p-4 ${getAgeColor(item.ageGroup)}`}
                                >
                                    <p className={`font-semibold ${getAgeColor(item.ageGroup)}`}>{item.ageGroup}세</p>
                                    <p className={`font-bold ${getAgeColor(item.ageGroup)}`}>{item.percentage}%</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
            </div>
        </>
    );
};
