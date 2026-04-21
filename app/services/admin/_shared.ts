// Shared types and helpers used across admin domain modules

export interface StatItem {
	grade: string;
	count: number;
	percentage: number;
}

export interface GenderStatItem {
	gender: string;
	stats: StatItem[];
}

export interface UnknownBreakdown {
	neverClassified: number;
	inactiveReset: number;
}

export interface FormattedData {
	total: number;
	stats: StatItem[];
	genderStats: GenderStatItem[];
	unknownBreakdown?: UnknownBreakdown;
}

export const getCountryHeader = (): string => {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('admin_selected_country') || 'kr';
	}
	return 'kr';
};

export function toStringParams(params: Record<string, unknown>): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null || v === '') continue;
		out[k] = String(v);
	}
	return out;
}
