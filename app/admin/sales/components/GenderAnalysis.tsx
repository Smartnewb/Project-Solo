'use client';

import { useState, useEffect } from 'react';
import { GenderAnalysis, paymentType } from '../types';
import { formateDateToString } from '../utils'
import { salesService } from '@/app/services/sales';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';



// MARK: - props
interface GenderAnalysisProps {
    startDate?: Date;
    endDate?: Date;
}

export function GenderAnalysisTable({ startDate, endDate }: GenderAnalysisProps) {
    // === 상태관리 ===
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [totalData, setTotalData] = useState<GenderAnalysis | null>(null);
    const [selectedPaymentType, setSelectedPaymentType] = useState<paymentType>('all');

    

    // === API ====
    const fetchGenderData = async (start?: Date, end?: Date) => {
        const { start: effectiveStart, end: effectiveEnd } = start && end
            ? { start , end}
            : getEffectiveDates();
        
            setIsLoading(true);

        try {
            const startDateString = formateDateToString(effectiveStart);
            const endDateString = formateDateToString(effectiveEnd);

            console.log('startDate:',startDateString);
            console.log('endDate:',endDateString);

            const response = await salesService.getGenderAnalysis({
                paymentType: selectedPaymentType !== 'all' ? selectedPaymentType : 'all',
                startDate: startDateString,
                endDate: endDateString,
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


    // === hooks ====
    // MARK: - 마운트
    useEffect(() => {
        fetchGenderData();
    }, []);

    // MARK: - 날짜 변경 감지
    useEffect(() => {
        fetchGenderData();
    }, [startDate, endDate]);

    // MARK: - 자동 새로고침
    // TODO: - 추후 구현

    // === utils ===
    // TODO: - utils로 분리

    const getGender = (gender: string): string => {
        const typeMap: Record<string, string> = {
            'MALE': '남성',
            'FEMALE': '여성',
        };
        return typeMap[gender] || gender;
    };
    const getChartColors = () => [
        '#87ceeb', '#d084d0', 
    ];

    const getAnalysisData = () => {
        if (!totalData) return [];
        if (totalData.data) {
            return totalData.data.map(item => ({
                gender: item.gender,
                totalAmount: item.amount,
                count: item.count,
                percentage: item.percentage,
            }));
        }
        if (totalData.analysis) {
            return totalData.analysis;
        }
        return [];
    };

    const getPieChartData = () => {
        const analysisData = getAnalysisData();
        if (analysisData.length === 0) return [];
        return analysisData.map(item => ({
            name: getGender(item.gender),
            value: item.totalAmount,
            count: item.count,
            percentage: item.percentage,
        }));
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
            <div className='bg-white  rounded-md px-6 py-6 gap-4 border border-border h-[800px]'>
                {/* MARK: - 헤더(타이틀) */}
                <div className=''>
                    <h2 className="text-xl font-semibold">성별 구매 비율</h2>
                </div>

                {/* MARK: - 메인 콘텐츠*/}
                <div className='flex flex-col gap-6'>
                    {!isLoading && totalData && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium mb-4">
                                성별 구매 비율
                            </h3>
                            {renderPieChart()}
                        </div>
                    )}

                    <div className='flex gap-4 mb-24'>
                        {getAnalysisData().map((item, index) => (
                            <div key={index} className={`rounded-md ${item.gender === 'MALE' ? 'bg-blue-50' : 'bg-pink-50'} flex-1 text-center`}>
                                <p className={`text-xl font-semibold ${item.gender === 'MALE' ? 'text-[#1D4ED8]' : 'text-pink-700'}`}>{item.percentage}%</p>
                                <p className='text-sm font-gray-900'>{item.gender === 'MALE' ? '남성' : '여성'}</p>
                                <p className={`text-sm ${item.gender === 'MALE' ? 'text-[#1D4ED8]' : 'text-pink-700'}`}>{item.count}명</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

}