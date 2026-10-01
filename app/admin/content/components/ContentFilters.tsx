'use client';
import { TextField, Label, Input, Select, ListBox } from '@heroui/react';
import { LEGACY_CATEGORY_SENTINEL, NEW_CATEGORY_OPTIONS, } from '../constants';
interface Props {
    category: string;
    status: string;
    search: string;
    onChange: (next: {
        category?: string;
        status?: string;
        search?: string;
    }) => void;
    includeNoticeCategory?: boolean;
    hideCategory?: boolean;
}
export function ContentFilters({ category, status, search, onChange, includeNoticeCategory, hideCategory, }: Props) {
    return <section className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border bg-white p-4" aria-label="콘텐츠 필터">
    {!hideCategory && <div className="min-w-[180px] space-y-2"><Select aria-label="카테고리" value={category} onChange={(key) => {
                const value = String(key ?? "");
                onChange({ category: value });
            }} className="min-w-[120px]"><Label>카테고리</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>{NEW_CATEGORY_OPTIONS.map(c => <ListBox.Item key={c.code} id={c.code} textValue={String(c.label)}>{c.label}</ListBox.Item>)}{includeNoticeCategory && <ListBox.Item id={"notice"} textValue={"\uACF5\uC9C0"}>공지</ListBox.Item>}<ListBox.Item id={LEGACY_CATEGORY_SENTINEL} textValue={"\uB808\uAC70\uC2DC"}>레거시</ListBox.Item></ListBox></Select.Popover></Select></div>}
    <div className="min-w-[150px] space-y-2"><Select aria-label="상태" value={status} onChange={(key) => {
            const value = String(key ?? "");
            onChange({ status: value });
        }} className="min-w-[120px]"><Label>상태</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item><ListBox.Item id={"draft"} textValue={"\uCD08\uC548"}>초안</ListBox.Item><ListBox.Item id={"published"} textValue={"\uAC8C\uC2DC\uC911"}>게시중</ListBox.Item><ListBox.Item id={"archived"} textValue={"\uBCF4\uAD00"}>보관</ListBox.Item></ListBox></Select.Popover></Select></div>
    <TextField className="min-w-[200px] flex-1" value={search} onChange={value => onChange({ search: value })}><Label>검색</Label><Input></Input></TextField>
  </section>;
}
