'use client';

import { useState } from 'react';
import { Box, Typography, Tabs, Tab, Chip } from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ReviewDashboard from './components/ReviewDashboard';
import ReviewList from './components/ReviewList';

export default function AppReviewsPage() {
	const [activeTab, setActiveTab] = useState(0);
	const [filterFromChart, setFilterFromChart] = useState<{
		rating?: number;
		store?: 'APP_STORE' | 'PLAY_STORE';
	} | null>(null);

	const handleChartClick = (filter: { rating?: number; store?: 'APP_STORE' | 'PLAY_STORE' }) => {
		setFilterFromChart(filter);
		setActiveTab(1);
	};

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		if (newValue === 0) {
			setFilterFromChart(null);
		}
		setActiveTab(newValue);
	};

	return (
		<Box className="min-h-screen bg-gray-50">
			{/* 헤더 */}
			<Box className="bg-white shadow-sm border-b border-gray-200">
				<Box className="max-w-7xl mx-auto px-4 py-4">
					<Box className="flex items-center justify-between">
						<Box className="flex items-center gap-3">
							<Box
								sx={{
									p: 1.5,
									borderRadius: 2,
									backgroundColor: '#f0f4ff',
									color: '#3b82f6',
								}}
							>
								<RateReviewIcon />
							</Box>
							<Box>
								<Typography variant="h5" fontWeight="bold" color="textPrimary">
									앱 리뷰 관리
								</Typography>
								<Typography variant="body2" color="textSecondary">
									App Store, Play Store 리뷰를 한눈에 관리합니다
								</Typography>
							</Box>
						</Box>
					</Box>
					<Tabs
						value={activeTab}
						onChange={handleTabChange}
						sx={{ mt: 2 }}
						aria-label="앱 리뷰 탭"
					>
						<Tab label="리뷰 대시보드" />
						<Tab
							label={
								<Box className="flex items-center gap-1">
									리뷰 목록
									{filterFromChart && activeTab === 1 && (
										<Chip
											label="필터 적용됨"
											size="small"
											color="primary"
											sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
										/>
									)}
								</Box>
							}
						/>
					</Tabs>
				</Box>
			</Box>

			{/* 탭 콘텐츠 */}
			<Box className="max-w-7xl mx-auto px-4 py-6">
				<Box role="tabpanel" hidden={activeTab !== 0}>
					{activeTab === 0 && <ReviewDashboard onChartClick={handleChartClick} />}
				</Box>
				<Box role="tabpanel" hidden={activeTab !== 1}>
					{activeTab === 1 && (
						<ReviewList
							initialFilter={filterFromChart}
							onFilterClear={() => setFilterFromChart(null)}
						/>
					)}
				</Box>
			</Box>
		</Box>
	);
}
