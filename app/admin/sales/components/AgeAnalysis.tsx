'use client';

import { useState, useEffect } from 'react';
import { AgeAnalysis, paymentType } from '../types';
import { formateDateToString } from '../utils'
import { salesService } from '@/app/services/sales';

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

    // === JSX ===
    return (
        <>
        </>
    );
};