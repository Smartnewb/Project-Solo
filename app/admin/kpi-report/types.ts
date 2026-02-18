// KPI Report Types

export type KpiStatus = 'good' | 'warning' | 'critical' | 'neutral';
export type TrendDirection = 'up' | 'down' | 'stable';
export type KpiCategory = 'acquisition' | 'engagement' | 'activation' | 'matching' | 'monetization';

export interface KpiValue {
	name: string;
	label: string;
	category: KpiCategory;
	currentValue: number;
	previousValue: number;
	changeRate: number;
	unit: 'count' | 'percent' | 'currency' | 'ratio' | 'days';
	status: KpiStatus;
	description?: string;
}

export interface TrendPoint {
	week: number;
	year: number;
	weekLabel: string;
	value: number;
}

export interface KpiTrend {
	name: string;
	label: string;
	category: KpiCategory;
	direction: TrendDirection;
	slope: number;
	points: TrendPoint[];
}

export interface CountryKpi {
	name: string;
	label: string;
	currentValue: number;
	previousValue: number;
	changeRate: number;
	unit: string;
	status: KpiStatus;
}

export interface CountryBreakdownData {
	KR: CountryKpi[];
	JP: CountryKpi[];
}

export interface KpiReport {
	id: string;
	year: number;
	week: number;
	weekLabel: string;
	generatedAt: string;
	kpis: KpiValue[];
	trends: KpiTrend[];
	countryBreakdown?: CountryBreakdownData;
}

export interface KpiDefinition {
	name: string;
	label: string;
	category: KpiCategory;
	unit: string;
	description: string;
}

export interface KpiDefinitionsResponse {
	definitions: KpiDefinition[];
	categories: Record<KpiCategory, string>;
}

// Constants

export const CATEGORY_CONFIG: Record<KpiCategory, { label: string; color: string; bgColor: string; icon: string }> = {
	acquisition: { label: '가입/전환', color: '#3b82f6', bgColor: '#eff6ff', icon: '📥' },
	engagement: { label: '프로필/활성', color: '#8b5cf6', bgColor: '#f5f3ff', icon: '✏️' },
	activation: { label: '활성 유저', color: '#10b981', bgColor: '#ecfdf5', icon: '🔥' },
	matching: { label: '매칭', color: '#f59e0b', bgColor: '#fffbeb', icon: '💕' },
	monetization: { label: '수익화', color: '#ef4444', bgColor: '#fef2f2', icon: '💰' },
};

export const STATUS_CONFIG: Record<KpiStatus, { color: 'success' | 'warning' | 'error' | 'default'; arrow: string }> = {
	good: { color: 'success', arrow: '✅' },
	warning: { color: 'warning', arrow: '⚠️' },
	critical: { color: 'error', arrow: '🔴' },
	neutral: { color: 'default', arrow: '➖' },
};

export const TREND_CONFIG: Record<TrendDirection, { color: string; arrow: string; label: string }> = {
	up: { color: '#22c55e', arrow: '↗', label: '상승' },
	down: { color: '#ef4444', arrow: '↘', label: '하락' },
	stable: { color: '#6b7280', arrow: '→', label: '보합' },
};

export const CATEGORIES: KpiCategory[] = ['acquisition', 'engagement', 'activation', 'matching', 'monetization'];

// Utility Functions

export function formatKpiValue(value: number, unit: string): string {
	switch (unit) {
		case 'percent':
			return `${value.toFixed(1)}%`;
		case 'currency':
			return `₩${value.toLocaleString()}`;
		case 'ratio':
			return value.toFixed(2);
		case 'days':
			return `${value.toFixed(1)}일`;
		default:
			return value.toLocaleString();
	}
}

export function formatChangeRate(rate: number): { text: string; color: string } {
	const sign = rate > 0 ? '+' : '';
	const text = `${sign}${rate.toFixed(1)}%`;
	const color = rate > 0 ? '#22c55e' : rate < 0 ? '#ef4444' : '#6b7280';
	return { text, color };
}

export function getISOWeekNumber(date: Date): { year: number; week: number } {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	return { year: d.getUTCFullYear(), week };
}

export function getCurrentWeekInfo(): { year: number; week: number; weekLabel: string } {
	const { year, week } = getISOWeekNumber(new Date());
	return { year, week, weekLabel: `${year}년 ${week}주차` };
}

export function getWeekLabel(year: number, week: number): string {
	return `${year}년 ${week}주차`;
}
