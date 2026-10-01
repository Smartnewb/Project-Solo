"use client";
import { useState } from 'react';
import { Tabs } from '@heroui/react';
import { MessageCircle, Landmark, ChartNoAxesCombined } from 'lucide-react';
import ChatManagementTab from './components/ChatManagementTab';
import ChatRefundTab from './components/ChatRefundTab';
import ChatStatsTab from './components/ChatStatsTab';

export default function ChatPageV2() {
  const [tab, setTab] = useState('management');
  return <section className="space-y-4"><h1 className="flex items-center gap-2 text-2xl font-bold"><MessageCircle aria-hidden="true" size={24} />채팅 관리</h1>
    <Tabs selectedKey={tab} onSelectionChange={key => setTab(String(key))}>
      <Tabs.List aria-label="채팅 관리 탭"><Tabs.Tab id="management"><MessageCircle aria-hidden="true" size={16} />채팅방 조회</Tabs.Tab><Tabs.Tab id="refund"><Landmark aria-hidden="true" size={16} />채팅 환불</Tabs.Tab><Tabs.Tab id="stats"><ChartNoAxesCombined aria-hidden="true" size={16} />채팅 통계</Tabs.Tab></Tabs.List>
      <Tabs.Panel id="management" className="pt-4">{tab === 'management' && <ChatManagementTab />}</Tabs.Panel>
      <Tabs.Panel id="refund" className="pt-4">{tab === 'refund' && <ChatRefundTab />}</Tabs.Panel>
      <Tabs.Panel id="stats" className="pt-4">{tab === 'stats' && <ChatStatsTab />}</Tabs.Panel>
    </Tabs>
  </section>;
}
