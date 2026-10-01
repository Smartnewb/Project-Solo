'use client';
import { Tabs } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';
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
export default function CommunityAutomationLayout({ children }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const currentTab = TABS.findIndex((t) => pathname.startsWith(t.path));
    return (<div style={{ padding: 24 }}>
			<h1 className="text-2xl font-bold" style={{ marginBottom: 16 }}>
				커뮤니티 관리
			</h1>
			<div style={{ marginBottom: 24 }}>
				<Tabs selectedKey={currentTab === -1 ? 0 : currentTab} onSelectionChange={v => router.push(TABS[Number(v)].path)}><Tabs.List aria-label="관리 항목">
					{TABS.map((t, index) => (<Tabs.Tab key={t.path} id={index}>{t.label}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>))}
				</Tabs.List></Tabs>
			</div>
			{children}
		</div>);
}
