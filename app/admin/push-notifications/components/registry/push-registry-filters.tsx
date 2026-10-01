import { TextField, Label, Input, Select, ListBox } from '@heroui/react';
import type { ReactNode } from 'react';
import type { RegistryFilters } from './push-registry-model';
import { formatCategoryName } from './push-registry-model';
type Props = {
    categories: string[];
    filters: RegistryFilters;
    onChange: (filters: RegistryFilters) => void;
};
export function PushRegistryFilters({ categories, filters, onChange }: Props) {
    const setFilter = (key: keyof RegistryFilters, value: string) => {
        const nextFilters = { ...filters, [key]: value };
        onChange(key === 'category' ? { ...nextFilters, eventType: 'all' } : nextFilters);
    };
    return (<section style={{ padding: 16, marginBottom: 16, borderRadius: 1 }} className="rounded-xl border bg-white p-4">
			<div style={{ display: 'grid', gap: 12 }}>
				<TextField className="mb-4"><Label>{"검색"}</Label><Input value={filters.search} onChange={(event) => setFilter('search', event.target.value)}></Input></TextField>
				<RegistrySelect label="카테고리" id="category" value={filters.category} onChange={(value) => setFilter('category', value)}>
					<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
					{categories.map((category) => (<ListBox.Item key={category} id={category} textValue={String(formatCategoryName(category)) + (" " + "(") + (" " + String(category)) + (" " + ")")}>
							{formatCategoryName(category)} ({category})
						</ListBox.Item>))}
				</RegistrySelect>
				<RegistrySelect label="트리거" id="trigger" value={filters.trigger} onChange={(value) => setFilter('trigger', value)}>
					<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
					<ListBox.Item id={"event"} textValue={"event"}>event</ListBox.Item>
					<ListBox.Item id={"cron"} textValue={"cron"}>cron</ListBox.Item>
				</RegistrySelect>
				<RegistrySelect label="소스" id="direct" value={filters.direct} onChange={(value) => setFilter('direct', value)}>
					<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
					<ListBox.Item id={"registry-only"} textValue={"registry\uB9CC"}>registry만</ListBox.Item>
					<ListBox.Item id={"direct-only"} textValue={"\uC9C1\uC811\uBC1C\uC1A1\uB9CC"}>직접발송만</ListBox.Item>
				</RegistrySelect>
				<RegistrySelect label="대상" id="audience" value={filters.audience} onChange={(value) => setFilter('audience', value)}>
					<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
					<ListBox.Item id={"single"} textValue={"single"}>single</ListBox.Item>
					<ListBox.Item id={"query"} textValue={"query"}>query</ListBox.Item>
				</RegistrySelect>
				<RegistrySelect label="저장" id="persistence" value={filters.persistence} onChange={(value) => setFilter('persistence', value)}>
					<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
					<ListBox.Item id={"persisted"} textValue={"\uC800\uC7A5\uB428"}>저장됨</ListBox.Item>
					<ListBox.Item id={"none"} textValue={"\uC800\uC7A5 \uC548 \uD568"}>저장 안 함</ListBox.Item>
				</RegistrySelect>
				<RegistrySelect label="Throttle" id="throttle" value={filters.throttle} onChange={(value) => setFilter('throttle', value)}>
					<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
					<ListBox.Item id={"enabled"} textValue={"\uC788\uC74C"}>있음</ListBox.Item>
					<ListBox.Item id={"disabled"} textValue={"\uC5C6\uC74C"}>없음</ListBox.Item>
				</RegistrySelect>
				<RegistrySelect label="채팅방 억제" id="suppress" value={filters.suppressInRoom} onChange={(value) => setFilter('suppressInRoom', value)}>
					<ListBox.Item id={"all"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
					<ListBox.Item id={"true"} textValue={"true"}>true</ListBox.Item>
					<ListBox.Item id={"false"} textValue={"false"}>false</ListBox.Item>
				</RegistrySelect>
			</div>
		</section>);
}
function RegistrySelect({ id, label, value, onChange, children, }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
}) {
    const labelId = `push-registry-${id}-label`;
    return (<div>
			<label id={labelId}>{label}</label>
			<Select value={value} aria-label={label} onChange={(key) => {
            const value = String(key ?? "");
            onChange(value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
				{children}
			</ListBox></Select.Popover></Select>
		</div>);
}
