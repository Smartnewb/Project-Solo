'use client';
import { Tabs } from '@heroui/react';
import React, { useState } from 'react';
import CountryOverview from './components/CountryOverview';
import ScheduleConfig from './components/ScheduleConfig';
import BatchHistory from './components/BatchHistory';
import ManualMatching from './components/ManualMatching';
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (<div role="tabpanel" hidden={value !== index} id={`schedule-tabpanel-${index}`} aria-labelledby={`schedule-tab-${index}`} {...other}>
      {value === index && <div style={{ paddingTop: 24 }}>{children}</div>}
    </div>);
}
function ScheduledMatchingPageContent() {
    const [activeTab, setActiveTab] = useState(0);
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };
    return (<div style={{ padding: 24 }}>
      <h1 className="text-2xl font-bold">
        스케줄 관리
      </h1>

      <Tabs aria-label="스케줄 관리 탭" selectedKey={activeTab} onSelectionChange={key => handleTabChange({} as never, key as never)}><Tabs.List aria-label="관리 항목">
        <Tabs.Tab id={0}>{"국가별 현황"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={1}>{"스케줄 설정"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={2}>{"배치 히스토리"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={3}>{"수동 매칭"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
      </Tabs.List></Tabs>

      <TabPanel value={activeTab} index={0}>
        <CountryOverview></CountryOverview>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ScheduleConfig></ScheduleConfig>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <BatchHistory></BatchHistory>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ManualMatching></ManualMatching>
      </TabPanel>
    </div>);
}
export default function ScheduledMatchingV2() {
    return <ScheduledMatchingPageContent></ScheduledMatchingPageContent>;
}
