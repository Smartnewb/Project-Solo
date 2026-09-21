'use client';

import { Box, IconButton, Typography, Button, CircularProgress } from '@mui/material';
import {
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getCurrentWeekInfo } from '../types';

interface WeekSelectorProps {
	year: number;
	week: number;
	weekLabel: string;
	onWeekChange: (year: number, week: number) => void;
	onGenerate: () => void;
	generating: boolean;
}

function getMaxWeeksInYear(year: number): number {
	const dec28 = new Date(year, 11, 28);
	const dayOfYear = Math.floor((dec28.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1;
	return Math.ceil(dayOfYear / 7);
}

export default function WeekSelector({ year, week, weekLabel, onWeekChange, onGenerate, generating }: WeekSelectorProps) {
	const current = getCurrentWeekInfo();
	const isCurrentOrFuture = year > current.year || (year === current.year && week >= current.week);

	const handlePrev = () => {
		if (week <= 1) {
			const prevYear = year - 1;
			onWeekChange(prevYear, getMaxWeeksInYear(prevYear));
		} else {
			onWeekChange(year, week - 1);
		}
	};

	const handleNext = () => {
		if (isCurrentOrFuture) return;
		const maxWeeks = getMaxWeeksInYear(year);
		if (week >= maxWeeks) {
			onWeekChange(year + 1, 1);
		} else {
			onWeekChange(year, week + 1);
		}
	};

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
			<IconButton onClick={handlePrev} size="small">
				<ChevronLeftIcon />
			</IconButton>
			<Typography variant="h6" fontWeight="bold" sx={{ minWidth: 140, textAlign: 'center' }}>
				{weekLabel}
			</Typography>
			<IconButton onClick={handleNext} size="small" disabled={isCurrentOrFuture}>
				<ChevronRightIcon />
			</IconButton>
			<Button
				variant="outlined"
				size="small"
				startIcon={generating ? <CircularProgress size={16} /> : <RefreshIcon />}
				onClick={onGenerate}
				disabled={generating}
				sx={{ ml: 2, textTransform: 'none' }}
			>
				{generating ? '생성 중...' : '리포트 생성'}
			</Button>
		</Box>
	);
}
