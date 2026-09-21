'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { PushRegistryTab, type PushRegistryView } from './components/push-registry-tab';
import { PushSendTab } from './components/push-send-tab';

type PushNotificationsTab = 'send' | 'registry';

const isPushNotificationsTab = (value: string | null): value is PushNotificationsTab =>
	value === 'send' || value === 'registry';

const isPushRegistryView = (value: string | null): value is PushRegistryView =>
	value === 'table' || value === 'graph';

function PushNotificationsV2Content() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tabParam = searchParams.get('tab');
	const viewParam = searchParams.get('view');
	const currentTab: PushNotificationsTab = isPushNotificationsTab(tabParam) ? tabParam : 'send';
	const registryView: PushRegistryView = isPushRegistryView(viewParam) ? viewParam : 'graph';

	const setTab = (tab: PushNotificationsTab) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('tab', tab);
		if (tab === 'send') {
			params.delete('view');
		}
		router.replace(`/admin/push-notifications?${params.toString()}`);
	};

	const setRegistryView = (view: PushRegistryView) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('tab', 'registry');
		params.set('view', view);
		router.push(`/admin/push-notifications?${params.toString()}`);
	};

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb' }}>
			<Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e5e7eb', px: 3, py: 2 }}>
				<Typography variant="h5" fontWeight={700}>
					푸시 알림 관리
				</Typography>
				<Tabs
					value={currentTab}
					onChange={(_, value) => setTab(value)}
					aria-label="푸시 알림 관리 탭"
					sx={{ mt: 2 }}
				>
					<Tab value="send" label="발송" />
					<Tab value="registry" label="상황별 알림" />
				</Tabs>
			</Box>

			{currentTab === 'send' ? <PushSendTab /> : <PushRegistryTab view={registryView} onViewChange={setRegistryView} />}
		</Box>
	);
}

export default function PushNotificationsV2() {
	return (
		<Suspense
			fallback={
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
					<CircularProgress />
				</Box>
			}
		>
			<PushNotificationsV2Content />
		</Suspense>
	);
}
