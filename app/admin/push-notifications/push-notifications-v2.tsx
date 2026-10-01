'use client';
import { Spinner, Tabs } from '@heroui/react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PushRegistryTab, type PushRegistryView } from './components/push-registry-tab';
import { PushSendTab } from './components/push-send-tab';
type PushNotificationsTab = 'send' | 'registry';
const isPushNotificationsTab = (value: string | null): value is PushNotificationsTab => value === 'send' || value === 'registry';
const isPushRegistryView = (value: string | null): value is PushRegistryView => value === 'table' || value === 'graph';
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
    return (<div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
			<div style={{ backgroundColor: 'white', paddingInline: 24, paddingBlock: 16 }}>
				<h1 className="text-2xl font-bold">
					푸시 알림 관리
				</h1>
				<Tabs aria-label="푸시 알림 관리 탭" style={{ marginTop: 16 }} selectedKey={currentTab} onSelectionChange={value => setTab(String(value) as PushNotificationsTab)}><Tabs.List aria-label="관리 항목">
					<Tabs.Tab id={"send"}>{"발송"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
					<Tabs.Tab id={"registry"}>{"상황별 알림"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
				</Tabs.List></Tabs>
			</div>

			{currentTab === 'send' ? <PushSendTab></PushSendTab> : <PushRegistryTab view={registryView} onViewChange={setRegistryView}></PushRegistryTab>}
		</div>);
}
export default function PushNotificationsV2() {
    return (<Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
					<Spinner size="sm"></Spinner>
				</div>}>
			<PushNotificationsV2Content></PushNotificationsV2Content>
		</Suspense>);
}
