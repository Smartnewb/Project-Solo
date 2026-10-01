'use client';

import { useState } from 'react';
import { Chip, Tabs } from '@heroui/react';
import UtmLinkCreator from './components/utm-link-creator';
import UtmLinkList from './components/utm-link-list';
import UtmDashboard from './components/utm-dashboard';

export default function UtmManagement({initialTab=0}:{initialTab?:0|1}){
  const [tab,setTab]=useState(initialTab===1?'dashboard':'links');
  const [refreshKey,setRefreshKey]=useState(0);
  return <main className="space-y-5"><header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">UTM 추적 관리</h1><p className="mt-1 text-sm text-gray-600">링크 생성/운영과 Meta 오프라인 리드 어트리뷰션 성과를 분리해서 확인합니다.</p></div><div className="flex flex-wrap gap-2"><Chip size="sm" variant="soft">마케팅 &gt; UTM 추적 관리</Chip><Chip size="sm" variant="soft">{tab==='dashboard'?'성과 대시보드':'링크 관리'}</Chip></div></header>
    <Tabs selectedKey={tab} onSelectionChange={key=>setTab(String(key))}><Tabs.ListContainer><Tabs.List aria-label="UTM 관리 화면"><Tabs.Tab id="links">링크 생성/관리<Tabs.Indicator/></Tabs.Tab><Tabs.Tab id="dashboard">성과 대시보드<Tabs.Indicator/></Tabs.Tab></Tabs.List></Tabs.ListContainer>
      <Tabs.Panel id="links">{tab==='links' && <div className="space-y-6"><UtmLinkCreator onCreated={()=>setRefreshKey(key=>key+1)}/><UtmLinkList refreshKey={refreshKey}/></div>}</Tabs.Panel>
      <Tabs.Panel id="dashboard">{tab==='dashboard' && <UtmDashboard/>}</Tabs.Panel>
    </Tabs>
  </main>;
}
