'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  TextField,
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
  PROFILE_RANK_OPTIONS,
  VALIDATION_OPTIONS,
} from '../constants';
import type { AuditFilters } from '../types';

const RANK_FILTER_OPTIONS = PROFILE_RANK_OPTIONS.filter((option) => option.value !== 'UNKNOWN');

type Props = {
  readonly filters: AuditFilters;
  readonly onChange: (filters: AuditFilters) => void;
};

export function AuditFiltersBar({ filters, onChange }: Props) {
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  useEffect(() => setSearchInput(filters.search ?? ''), [filters.search]);
  const submitSearch = () => {
    const search = searchInput.trim();
    onChange({ ...filters, search: search || undefined, auditStatus: undefined, includeAlreadyAudited: true });
  };
  const update = (patch: Partial<AuditFilters>) => onChange({ ...filters, ...patch });
  const findAuditStatus = (value: string) =>
    AUDIT_STATUS_OPTIONS.find((option) => option.value === value)?.value;
  const findValidationDecision = (value: string) =>
    VALIDATION_OPTIONS.find((option) => option.value === value)?.value;

  return (
    <Stack spacing={1.5}>
      <Stack component="form" direction="row" spacing={1} onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
        <TextField
          size="small"
          label="이름 · 학교 · 회원 ID 검색"
          placeholder="이름 또는 학교 이름을 입력하세요"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          inputProps={{ maxLength: 100 }}
          sx={{ minWidth: 220, flex: 1, maxWidth: 420 }}
        />
        <Button type="submit" variant="contained">검색</Button>
        {filters.search && <Button onClick={() => { setSearchInput(''); update({ search: undefined }); }}>검색 지우기</Button>}
      </Stack>
    <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" alignItems="center">
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="audit-status-label">검수 상태</InputLabel>
        <Select
          labelId="audit-status-label"
          label="검수 상태"
          value={filters.auditStatus ?? ''}
          onChange={(event) =>
            update({ auditStatus: findAuditStatus(event.target.value), includeAlreadyAudited: event.target.value === '' })
          }
        >
          <MenuItem value="">전체</MenuItem>
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
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="audit-rank-label">외모 등급</InputLabel>
        <Select
          labelId="audit-rank-label"
          label="외모 등급"
          value={filters.profileRank ?? ''}
          onChange={(event) => {
            const rank = RANK_FILTER_OPTIONS.find((option) => option.value === event.target.value)?.value;
            update({ profileRank: rank === 'UNKNOWN' ? undefined : rank });
          }}
        >
          <MenuItem value="">전체</MenuItem>
          {RANK_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
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
    </Stack>
  );
}
