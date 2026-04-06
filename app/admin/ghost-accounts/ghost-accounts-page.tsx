'use client';

import { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import DashboardTab from './components/DashboardTab';
import PoolTab from './components/PoolTab';
import EligibleSourcesTab from './components/EligibleSourcesTab';
import CandidatesTab from './components/CandidatesTab';

export default function GhostAccountsPage() {
	const [activeTab, setActiveTab] = useState(0);

	return (
		<Box>
			<Box sx={{ mb: 3 }}>
				<Typography variant="h5" fontWeight="bold">
					Ghost 계정 관리
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
					탈퇴 여성 유저의 프로필을 복제한 Ghost 계정을 관리하고, 비활성 남성 유저에게 좋아요를 발송합니다.
				</Typography>
			</Box>

			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
					<Tab label="대시보드" />
					<Tab label="Ghost 풀" />
					<Tab label="후보 생성" />
					<Tab label="후보 승인" />
				</Tabs>
			</Box>

			{activeTab === 0 && <DashboardTab />}
			{activeTab === 1 && <PoolTab />}
			{activeTab === 2 && <EligibleSourcesTab />}
			{activeTab === 3 && <CandidatesTab />}
		</Box>
	);
}
