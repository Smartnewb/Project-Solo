'use client';

import { useState, useEffect } from "react";
import { salesService } from '@/app/services/sales';
import { TrendCustomResponse  } from "../types";
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
import { formatCurrency } from "../utils";

interface MonthlyPaymentData {
    month: string;
    totalAmount: number;
    pgAmount: number;
    iapAmount: number;
    count: number;
    pgCount: number;
    iapCount: number;
};

export function MonthlyPaymentGraph() {
    // === 상태관리 ===
    const [chartData, setChartData] = useState<MonthlyPaymentData[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('2025'); // NOTE: 연간 버튼 구현 추가 필요
    const [isLoading, setIsLoading] = useState<boolean>(false);
    

    // === API ===
    const fetchMonthlyPaymentData = async () => {
        setIsLoading(true);
        
        try {
            const currentYear = new Date().getFullYear();
            const startDate = `${currentYear}-01-01`;
            const endDate = `${currentYear}-12-31`;
            
            // NOTE: - api 병렬 호출
            const [allTrend, pgTrend, iapTrend] = await Promise.all([
                salesService.getTrendCustom({
                    startDate: startDate,
                    endDate: endDate,
                    paymentType: 'all',
                    byRegion: false
                }),
                salesService.getTrendCustom({
                    startDate: startDate,
                    endDate: endDate,
                    paymentType: 'exclude_iap',
                    byRegion: false
                }),
                salesService.getTrendCustom({
                    startDate: startDate,
                    endDate: endDate,
                    paymentType: 'iap_only',
                    byRegion: false
                }),

            ]);
            // NOTE: - response 결합 (월별로 합산)
            const monthlyGroups: { [key: string]: MonthlyPaymentData } = {};

            allTrend.data?.forEach(dayData => {
                const monthKey = dayData.label.substring(0, 7); // "2025-01-01" -> "2025-01"
                
                if (!monthlyGroups[monthKey]) {
                    monthlyGroups[monthKey] = {
                        month: monthKey,
                        totalAmount: 0,
                        pgAmount: 0,
                        iapAmount: 0,
                        count: 0,
                        pgCount: 0,
                        iapCount: 0
                    };
                }
                
                monthlyGroups[monthKey].totalAmount += dayData.amount;
                monthlyGroups[monthKey].count += dayData.count;
                
                // PG 
                const pgDay = pgTrend.data?.find(d => d.label === dayData.label);
                if (pgDay) {
                    monthlyGroups[monthKey].pgAmount += pgDay.amount;
                    monthlyGroups[monthKey].pgCount += pgDay.count;
                }
                
                // IAP
                const iapDay = iapTrend.data?.find(d => d.label === dayData.label);
                if (iapDay) {
                    monthlyGroups[monthKey].iapAmount += iapDay.amount;
                    monthlyGroups[monthKey].iapCount += iapDay.count;
                }
            });

            const combinedData: MonthlyPaymentData[] = Object.values(monthlyGroups)
                .sort((a, b) => a.month.localeCompare(b.month));
            
            setChartData(combinedData);
        } catch(error) {
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }

        
    };

    // MARK: - 그래프 툴팁
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-medium">{`${formatMonthLabel(label)}`}</p>
                    <p style={{ color: "#8884d8" }}>
                        WELCOME payment: {formatCurrency(data.pgAmount)} ({data.pgCount}건)
                    </p>
                    <p style={{ color: "#82ca9d" }}>
                        Apple 인앱 결제: {formatCurrency(data.iapAmount)} ({data.iapCount}건)
                    </p>
                    <p className="font-semibold border-t pt-1 mt-1">
                        총 매출: {formatCurrency(data.totalAmount)} ({data.count}건)
                    </p>
                </div>
            );
        }
        return null;
    };

    const formatMonthLabel = (monthStr: string): string => {
        // "2025-01-28" -> "1월"
        const parts = monthStr.split('-');
        if (parts.length >= 2) {
            const month = parseInt(parts[1]);
            return `${month}월`;
        }
        return monthStr;
    };

    const CustomStackLabel = (props: any) => {
        const { payload, x, y, width } = props;
        
        if (props.dataKey === 'iapAmount') {
            return (
                <text
                    x={x + width / 2}
                    y={y - 5}
                    fill="#666"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="500"
                >
                    {payload.count}건
                </text>
            );
        }
        return null;
    };


    // === hooks ===
    // MARK: - 마운트
    useEffect(()=>{
        fetchMonthlyPaymentData();
    },[]);

    return (
        <>
            {/* MARK: - 전체 컨테이너 */}
            <div className="bg-white rounded-md w-ful border border-border px-6 py-6">
                {/* MARK: - 헤더(타이틀) */}
                <div className="flex justify-between items-center mb-[0px]">
                    <h2 className="text-xl font-semibold">월별 매출 추이</h2>
                    <button className={`px-3 py-1.5 text-sm rounded-md transition-colors' 
                    ${selectedYear === '2025'
                        ? 'text-white bg-[#7D4EE4]'
                        : 'border border-border text-gray-700 bg-gary-100 text-gray-700'
                    }`}>{selectedYear}</button>
                </div>


                {/* MAR: - 메인 콘텐츠 */}
                <div>
                    {/* MARK: - 로딩 상태 */}
                    {isLoading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            <span className="ml-2">데이터를 불러오는 중...</span>
                        </div>
                    )}

                    {/* MARK: - 차트 영역 */}
                    {!isLoading && chartData.length > 0 && (
                        <div className="h-[420px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart 
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tickFormatter={formatMonthLabel}/>
                                    <YAxis 
                                        tickFormatter={formatCurrency}
                                        tick={{ fontSize: 12 }}
                                        width={80}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    
                                    {/* MARK: - 스택형 막대 */}
                                    <Bar
                                        dataKey="pgAmount"
                                        stackId="a"
                                        fill="#8884d8"
                                        name="WELCOME payment"
                                    />
                                    <Bar
                                        dataKey="iapAmount"
                                        stackId="a"
                                        fill="#82ca9d"
                                        name="Apple 인앱 결제"
                                        label={<CustomStackLabel />}
                                    />
                                    
                                    {/* MARK: - 매출 추이선 */}
                                    <Line
                                        type="monotone"
                                        dataKey="totalAmount"
                                        stroke="#ff7c7c"
                                        strokeWidth={3}
                                        name="총 매출 추이"
                                        dot={{ fill: '#ff7c7c', strokeWidth: 2, r: 5 }}
                                        strokeDasharray="5 5"
                                    />
                                    
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* MARK: - 에러처리 */}
                    {!isLoading && chartData.length === 0  && (
                        <div className="text-center py-12 text-gray-500">
                            해당 기간에 표시할 데이터가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};