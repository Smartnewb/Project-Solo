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

    // MARK: - 색상
    const AGE_COLOR_SYSTEM = [
        {
            chart: '#3B82F6',
            bg: 'bg-blue-50',
            text: 'text-blue-700',
        },
        {
            chart: '#10B981',
            bg: 'bg-green-50',
            text: 'text-green-700',
            
        },
        {
            chart: '#8B5CF6',
            bg: 'bg-purple-50',
            text: 'text-purple-700',
            
        },
        {
            chart: '#F59E0B',
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            
        },
        {
            chart: '#EC4899',
            bg: 'bg-pink-50',
            text: 'text-pink-700',
            
        }
    ];

    const getChartColors = () => AGE_COLOR_SYSTEM.map(color => color.chart);
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
                                labelLine={true}
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
                                연령대별 구매 비율
                            </h3>
                            {renderPieChart()}
                        </div>
                    )}
                    <div className='flex flex-col gap-2'>
                        {totalData?.analysis?.map((item, index) => {
                            const colorSystem = AGE_COLOR_SYSTEM[index % AGE_COLOR_SYSTEM.length];
                            
                            return (
                                <div 
                                    key={index}
                                    className={`flex justify-between items-center rounded-lg p-4  ${colorSystem.bg}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: colorSystem.chart }}
                                        />
                                        <p className={`font-semibold ${colorSystem.text}`}>
                                            {item.ageGroup === '30+' ? '30세 이상' : item.ageGroup+'세'}
                                        </p>
                                    </div>
                                    <p className={`font-bold ${colorSystem.text}`}>
                                        {item.percentage.toFixed(1)}%
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
            </div>
        </>
    );
};
