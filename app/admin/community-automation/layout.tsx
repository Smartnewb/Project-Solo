'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Box, Tab, Tabs, Typography } from '@mui/material';

const TABS = [
	{ label: '게시글 관리 · AI 활동', path: '/admin/community-automation/target-posts' },
	{ label: '주간 질문', path: '/admin/community-automation/questions' },
	{ label: '오늘의 상담', path: '/admin/community-automation/love-court' },
	{ label: '검수 대기', path: '/admin/community-automation/review-queue' },
	{ label: '예약/메트릭', path: '/admin/community-automation/metrics' },
	{ label: '리뷰 자동작성', path: '/admin/community-automation/review-posts' },
	{ label: '캠페인(고급)', path: '/admin/community-automation/campaigns' },
	{ label: '설정', path: '/admin/community-automation/settings' },
];

export default function CommunityAutomationLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();

	const currentTab = TABS.findIndex((t) => pathname.startsWith(t.path));

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h5" fontWeight={700} mb={2}>
				커뮤니티 관리
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
