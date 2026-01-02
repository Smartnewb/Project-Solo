'use client';

import { useState, useEffect } from 'react';
import { salesService } from '@/app/services/sales';
import { PaymentSuccessRateResponse } from '../types';

export function SuccessRate() {
    const [data, setData] = useState<PaymentSuccessRateResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchSuccessRate = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await salesService.getSuccessRate();
            setData(response);
        } catch (err) {
            console.error('결제 성공률 조회 실패:', err);
            setError('결제 성공률 데이터를 불러오는데 실패했습니다.');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuccessRate();
    }, []);

    const getSuccessRateColor = (rate: number): string => {
        if (rate >= 95) return 'text-green-600';
        if (rate >= 90) return 'text-blue-600';
        if (rate >= 80) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSuccessRateBgColor = (rate: number): string => {
        if (rate >= 95) return 'bg-green-50';
        if (rate >= 90) return 'bg-blue-50';
        if (rate >= 80) return 'bg-yellow-50';
        return 'bg-red-50';
    };

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('ko-KR').format(num);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">결제 성공률</h2>
                        <p className="text-sm text-gray-500 mt-1">결제 시도 대비 성공 비율을 확인하세요</p>
                    </div>
                    <button
                        onClick={fetchSuccessRate}
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                    >
                        {isLoading ? '조회 중...' : '새로고침'}
                    </button>
                </div>
            </div>

            <div className="p-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
                    </div>
                )}

                {!isLoading && data && (
                    <div className="space-y-6">
                        <div className={`text-center p-8 rounded-lg ${getSuccessRateBgColor(data.successRate)}`}>
                            <div className="text-sm text-gray-600 mb-2">결제 성공률</div>
                            <div className={`text-5xl font-bold ${getSuccessRateColor(data.successRate)}`}>
                                {data.successRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                기준일: {data.date}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">총 결제 시도</div>
                                <div className="text-2xl font-semibold text-gray-900">
                                    {formatNumber(data.totalAttempts)}건
                                </div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">성공한 결제</div>
                                <div className="text-2xl font-semibold text-green-700">
                                    {formatNumber(data.successfulPayments)}건
                                </div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">실패한 결제</div>
                                <div className="text-2xl font-semibold text-red-700">
                                    {formatNumber(data.totalAttempts - data.successfulPayments)}건
                                </div>
                            </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                                style={{ width: `${data.successRate}%` }}
                            />
                        </div>
                    </div>
                )}

                {!isLoading && !data && !error && (
                    <div className="text-center py-12 text-gray-500">
                        결제 성공률 데이터가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
