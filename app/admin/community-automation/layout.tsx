'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Box, Tab, Tabs, Typography } from '@mui/material';

const TABS = [
	{ label: '캠페인', path: '/admin/community-automation/campaigns' },
	{ label: '검수 큐', path: '/admin/community-automation/review-queue' },
	{ label: '메트릭스', path: '/admin/community-automation/metrics' },
	{ label: '페르소나', path: '/admin/community-automation/personas' },
	{ label: '설정', path: '/admin/community-automation/settings' },
];

export default function CommunityAutomationLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();

	const currentTab = TABS.findIndex((t) => pathname.startsWith(t.path));

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h5" fontWeight={700} mb={2}>
				커뮤니티 자동화
			</Typography>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs value={currentTab === -1 ? 0 : currentTab} onChange={(_, v) => router.push(TABS[v].path)}>
					{TABS.map((t) => (
						<Tab key={t.path} label={t.label} />
					))}
				</Tabs>
			</Box>
			{children}
		</Box>
	);
}
