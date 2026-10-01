'use client';
import { Select, ListBox } from '@heroui/react';
import { CATEGORY_LABELS, GENDER_LABELS } from '../constants';
interface Filters {
    gender: 'ALL' | 'MALE' | 'FEMALE';
    category: 'ALL' | 'VIBE' | 'FASHION' | 'COLOR_TONE';
    status: 'ALL' | 'ACTIVE' | 'INACTIVE';
}
interface StyleReferenceFiltersProps {
    filters: Filters;
    onChange: (filters: Filters) => void;
}
export function StyleReferenceFilters({ filters, onChange }: StyleReferenceFiltersProps) {
    const handleChange = (field: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({ ...filters, [field]: e.target.value });
    };
    return (<div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 120 }}>
        <label>성별</label>
        <Select value={filters.gender} aria-label={"성별"} onChange={(key) => {
            const value = String(key ?? "");
            (handleChange('gender'))({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={"ALL"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          {(Object.keys(GENDER_LABELS) as Array<keyof typeof GENDER_LABELS>).map((g) => (<ListBox.Item key={g} id={g} textValue={String(GENDER_LABELS[g])}>{GENDER_LABELS[g]}</ListBox.Item>))}
        </ListBox></Select.Popover></Select>
      </div>

      <div style={{ minWidth: 140 }}>
        <label>카테고리</label>
        <Select value={filters.category} aria-label={"카테고리"} onChange={(key) => {
            const value = String(key ?? "");
            (handleChange('category'))({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={"ALL"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((c) => (<ListBox.Item key={c} id={c} textValue={String(CATEGORY_LABELS[c])}>{CATEGORY_LABELS[c]}</ListBox.Item>))}
        </ListBox></Select.Popover></Select>
      </div>

      <div style={{ minWidth: 120 }}>
        <label>상태</label>
        <Select value={filters.status} aria-label={"상태"} onChange={(key) => {
            const value = String(key ?? "");
            (handleChange('status'))({ target: { value: value }, currentTarget: { value: value } } as never);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={"ALL"} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          <ListBox.Item id={"ACTIVE"} textValue={"\uD65C\uC131"}>활성</ListBox.Item>
          <ListBox.Item id={"INACTIVE"} textValue={"\uBE44\uD65C\uC131"}>비활성</ListBox.Item>
        </ListBox></Select.Popover></Select>
      </div>
    </div>);
}
export type { Filters };
