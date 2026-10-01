'use client';
import { Select, ListBox, Checkbox } from '@heroui/react';
import { AUDIT_STATUS_OPTIONS, PROFILE_RANK_OPTIONS, VALIDATION_OPTIONS, } from '../constants';
import type { AuditFilters } from '../types';
const RANK_FILTER_OPTIONS = PROFILE_RANK_OPTIONS.filter((option) => option.value !== 'UNKNOWN');
type Props = {
    readonly filters: AuditFilters;
    readonly onChange: (filters: AuditFilters) => void;
};
export function AuditFiltersBar({ filters, onChange }: Props) {
    const update = (patch: Partial<AuditFilters>) => onChange({ ...filters, ...patch });
    const findAuditStatus = (value: string) => AUDIT_STATUS_OPTIONS.find((option) => option.value === value)?.value;
    const findValidationDecision = (value: string) => VALIDATION_OPTIONS.find((option) => option.value === value)?.value;
    return (<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <div style={{ minWidth: 140 }}>
        <label id="audit-status-label">검수 상태</label>
        <Select value={filters.auditStatus ?? ''} aria-label={"검수 상태"} onChange={(key) => {
            const value = String(key ?? "");
            update({ auditStatus: findAuditStatus(value) });
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          {AUDIT_STATUS_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
              {option.label}
            </ListBox.Item>))}
        </ListBox></Select.Popover></Select>
      </div>
      <div style={{ minWidth: 120 }}>
        <label id="audit-gender-label">성별</label>
        <Select value={filters.gender ?? ''} aria-label={"성별"} onChange={(key) => {
            const value = String(key ?? "");
            update({ gender: value || undefined });
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          <ListBox.Item id={"FEMALE"} textValue={"\uC5EC\uC131"}>여성</ListBox.Item>
          <ListBox.Item id={"MALE"} textValue={"\uB0A8\uC131"}>남성</ListBox.Item>
        </ListBox></Select.Popover></Select>
      </div>
      <div style={{ minWidth: 120 }}>
        <label id="audit-rank-label">외모 등급</label>
        <Select value={filters.profileRank ?? ''} aria-label={"외모 등급"} onChange={(key) => {
            const value = String(key ?? "");
            const rank = RANK_FILTER_OPTIONS.find((option) => option.value ===
                value)?.value;
            update({ profileRank: rank === 'UNKNOWN' ? undefined : rank });
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          {RANK_FILTER_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
              {option.label}
            </ListBox.Item>))}
        </ListBox></Select.Popover></Select>
      </div>
      <div style={{ minWidth: 140 }}>
        <label id="validation-label">자동판정</label>
        <Select value={filters.validationDecision ?? ''} aria-label={"자동판정"} onChange={(key) => {
            const value = String(key ?? "");
            update({ validationDecision: findValidationDecision(value) });
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
          <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
          {VALIDATION_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
              {option.label}
            </ListBox.Item>))}
        </ListBox></Select.Popover></Select>
      </div>
      <Checkbox isSelected={filters.isMain === true} onChange={checked => update({ isMain: checked ? true : undefined })} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"대표 사진만"}</Checkbox.Content></Checkbox>
      <Checkbox isSelected={filters.hasReport === true} onChange={checked => update({ hasReport: checked ? true : undefined })} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"신고 있음"}</Checkbox.Content></Checkbox>
    </div>);
}
