'use client';

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import {
  AUDIT_STATUS_OPTIONS,
  VALIDATION_OPTIONS,
} from '../constants';
import type { AuditFilters } from '../types';

type Props = {
  readonly filters: AuditFilters;
  readonly onChange: (filters: AuditFilters) => void;
};

export function AuditFiltersBar({ filters, onChange }: Props) {
  const update = (patch: Partial<AuditFilters>) => onChange({ ...filters, ...patch });
  const findAuditStatus = (value: string) =>
    AUDIT_STATUS_OPTIONS.find((option) => option.value === value)?.value;
  const findValidationDecision = (value: string) =>
    VALIDATION_OPTIONS.find((option) => option.value === value)?.value;

  return (
    <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" alignItems="center">
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="audit-status-label">검수 상태</InputLabel>
        <Select
          labelId="audit-status-label"
          label="검수 상태"
          value={filters.auditStatus ?? ''}
          onChange={(event) =>
            update({ auditStatus: findAuditStatus(event.target.value) })
          }
        >
          {AUDIT_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="audit-gender-label">성별</InputLabel>
        <Select
          labelId="audit-gender-label"
          label="성별"
          value={filters.gender ?? ''}
          onChange={(event) => update({ gender: event.target.value || undefined })}
        >
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="FEMALE">여성</MenuItem>
          <MenuItem value="MALE">남성</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="validation-label">자동판정</InputLabel>
        <Select
          labelId="validation-label"
          label="자동판정"
          value={filters.validationDecision ?? ''}
          onChange={(event) =>
            update({ validationDecision: findValidationDecision(event.target.value) })
          }
        >
          <MenuItem value="">전체</MenuItem>
          {VALIDATION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={filters.isMain === true}
            onChange={(event) => update({ isMain: event.target.checked ? true : undefined })}
          />
        }
        label="대표 사진만"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={filters.hasReport === true}
            onChange={(event) => update({ hasReport: event.target.checked ? true : undefined })}
          />
        }
        label="신고 있음"
      />
    </Stack>
  );
}
