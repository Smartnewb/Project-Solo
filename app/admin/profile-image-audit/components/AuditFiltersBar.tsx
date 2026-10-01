'use client';
import { Button, Input, TextField, Label, Select, ListBox, Checkbox } from '@heroui/react';
import { AUDIT_STATUS_OPTIONS, PROFILE_RANK_OPTIONS, VALIDATION_OPTIONS, } from '../constants';
import { useEffect, useState } from 'react';
import type { AuditFilters } from '../types';
const RANK_FILTER_OPTIONS = PROFILE_RANK_OPTIONS.filter((option) => option.value !== 'UNKNOWN');
type Props = {
    readonly filters: AuditFilters;
    readonly onChange: (filters: AuditFilters) => void;
};
export function AuditFiltersBar({ filters, onChange }: Props) {
    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    useEffect(() => setSearchInput(filters.search ?? ''), [filters.search]);
    const submitSearch = () => onChange({ ...filters, search: searchInput.trim() || undefined, auditStatus: undefined, includeAlreadyAudited: true });
    const update = (patch: Partial<AuditFilters>) => onChange({ ...filters, ...patch });
    const findAuditStatus = (value: string) => AUDIT_STATUS_OPTIONS.find((option) => option.value === value)?.value;
    const findValidationDecision = (value: string) => VALIDATION_OPTIONS.find((option) => option.value === value)?.value;
    return (<div className="space-y-3"><form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); submitSearch(); }}><TextField><Label>이름 · 학교 · 회원 ID 검색</Label><Input placeholder="이름 또는 학교 이름을 입력하세요" value={searchInput} maxLength={100} onChange={event => setSearchInput(event.target.value)} /></TextField><Button type="submit" variant="primary">검색</Button>{filters.search && <Button variant="secondary" onPress={() => { setSearchInput(''); update({ search: undefined }); }}>검색 지우기</Button>}</form><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <div style={{ minWidth: 140 }}>
        <Select value={filters.auditStatus ?? ''} aria-label={"검수 상태"} onChange={(key) => {
            const value = String(key ?? "");
            update({ auditStatus: findAuditStatus(value), includeAlreadyAudited: value === '' });
        }} className="min-w-[120px]"><Label>검수 상태</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id="" textValue="전체">전체</ListBox.Item>{AUDIT_STATUS_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
              {option.label}
            </ListBox.Item>))}
        </ListBox></Select.Popover></Select>
      </div>
      <div style={{ minWidth: 120 }}>
        <Select value={filters.gender ?? ''} aria-label={"성별"} onChange={(key) => {
            const value = String(key ?? "");
            update({ gender: value || undefined });
        }} className="min-w-[120px]"><Label>성별</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          <ListBox.Item id={"FEMALE"} textValue={"\uC5EC\uC131"}>여성</ListBox.Item>
          <ListBox.Item id={"MALE"} textValue={"\uB0A8\uC131"}>남성</ListBox.Item>
        </ListBox></Select.Popover></Select>
      </div>
      <div style={{ minWidth: 120 }}>
        <Select value={filters.profileRank ?? ''} aria-label={"외모 등급"} onChange={(key) => {
            const value = String(key ?? "");
            const rank = RANK_FILTER_OPTIONS.find((option) => option.value ===
                value)?.value;
            update({ profileRank: rank === 'UNKNOWN' ? undefined : rank });
        }} className="min-w-[120px]"><Label>외모 등급</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          {RANK_FILTER_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
              {option.label}
            </ListBox.Item>))}
        </ListBox></Select.Popover></Select>
      </div>
      <div style={{ minWidth: 140 }}>
        <Select value={filters.validationDecision ?? ''} aria-label={"자동판정"} onChange={(key) => {
            const value = String(key ?? "");
            update({ validationDecision: findValidationDecision(value) });
        }} className="min-w-[120px]"><Label>자동판정</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          {VALIDATION_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
              {option.label}
            </ListBox.Item>))}
        </ListBox></Select.Popover></Select>
      </div>
      <Checkbox isSelected={filters.isMain === true} onChange={checked => update({ isMain: checked ? true : undefined })} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"대표 사진만"}</Checkbox.Content></Checkbox>
      <Checkbox isSelected={filters.hasReport === true} onChange={checked => update({ hasReport: checked ? true : undefined })} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"신고 있음"}</Checkbox.Content></Checkbox>
    </div></div>);
}
