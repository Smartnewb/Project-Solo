'use client';
import { Tabs } from '@heroui/react';
export type RecipientMode = 'filter' | 'userIds';
interface Props {
    mode: RecipientMode;
    onChange: (next: RecipientMode) => void;
    disabled?: boolean;
}
export function RecipientModeToggle({ mode, onChange, disabled }: Props) {
    return (<div style={{ marginBottom: 16 }}>
      <Tabs selectedKey={mode} onSelectionChange={v => onChange(v as RecipientMode)}><Tabs.List aria-label="관리 항목">
        <Tabs.Tab isDisabled={disabled} id={"filter"}>{"조건 필터"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab isDisabled={disabled} id={"userIds"}>{"사용자 직접 검색"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
      </Tabs.List></Tabs>
    </div>);
}
