'use client';

import type { ChangeEvent } from 'react';
import {
  CAMPUS_AREAS,
  FALLBACK_STRATEGIES,
  GENDER_PRESENTATIONS,
  type CampusArea,
  type FallbackStrategy,
  type GenderPresentation,
} from '@/app/types/ai-profile-generator';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { AdvancedJsonPanel } from '../_shared/advanced-json-panel';
import { NumberRangeInput } from '../_shared/number-range-input';
import {
  asStringArray,
  pickExtra,
  pruneEmpty,
} from '../_shared/policy-utils';
import { StringListInput } from '../_shared/string-list-input';

interface Props {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
}

const KNOWN_KEYS = [
  'universityIds',
  'departmentIds',
  'campusAreas',
  'ageRange',
  'genderPresentation',
  'minReferenceCount',
  'fallbackStrategy',
] as const;

const UNSET = 'unset';

function asRange(v: unknown): { min?: number; max?: number } {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const record = v as Record<string, unknown>;
  const min = typeof record.min === 'number' ? record.min : undefined;
  const max = typeof record.max === 'number' ? record.max : undefined;
  return { min, max };
}

export function SourceDataPolicyFields({ value, onChange, disabled }: Props) {
  const universityIds = asStringArray(value.universityIds);
  const departmentIds = asStringArray(value.departmentIds);
  const campusAreas = asStringArray(value.campusAreas);
  const ageRange = asRange(value.ageRange);
  const genderPresentation =
    typeof value.genderPresentation === 'string'
      ? (value.genderPresentation as string)
      : '';
  const minReferenceCount =
    typeof value.minReferenceCount === 'number'
      ? value.minReferenceCount
      : undefined;
  const fallbackStrategy =
    typeof value.fallbackStrategy === 'string'
      ? (value.fallbackStrategy as string)
      : '';

  const extra = pickExtra(value, KNOWN_KEYS);

  const emitKnown = (patch: Record<string, unknown>) => {
    const known: Record<string, unknown> = {
      universityIds,
      departmentIds,
      campusAreas,
      ageRange,
      genderPresentation: genderPresentation || undefined,
      minReferenceCount,
      fallbackStrategy: fallbackStrategy || undefined,
      ...patch,
    };
    onChange(pruneEmpty({ ...extra, ...known }));
  };

  const handleExtraChange = (nextExtra: Record<string, unknown>) => {
    const known: Record<string, unknown> = pruneEmpty({
      universityIds,
      departmentIds,
      campusAreas,
      ageRange,
      genderPresentation: genderPresentation || undefined,
      minReferenceCount,
      fallbackStrategy: fallbackStrategy || undefined,
    });
    onChange({ ...nextExtra, ...known });
  };

  const handleMinReference = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.trim();
    const parsed = raw === '' ? undefined : Number(raw);
    emitKnown({
      minReferenceCount:
        parsed === undefined || Number.isNaN(parsed) ? undefined : parsed,
    });
  };

  const invalidCampusAreas = campusAreas.filter(
    (area) => !(CAMPUS_AREAS as readonly string[]).includes(area),
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>학교 ID</Label>
        <StringListInput
          value={universityIds}
          onChange={(next) => emitKnown({ universityIds: next })}
          placeholder="학교 ID 입력"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>학과 ID</Label>
        <StringListInput
          value={departmentIds}
          onChange={(next) => emitKnown({ departmentIds: next })}
          placeholder="학과 ID 입력"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>지역 (캠퍼스 권역)</Label>
        <StringListInput
          value={campusAreas}
          onChange={(next) =>
            emitKnown({ campusAreas: next as CampusArea[] })
          }
          placeholder={`허용 코드: ${CAMPUS_AREAS.join(', ')}`}
          disabled={disabled}
        />
        {invalidCampusAreas.length > 0 ? (
          <p className="text-xs text-amber-600">
            표준 코드가 아닌 값: {invalidCampusAreas.join(', ')}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label>나이 범위</Label>
        <NumberRangeInput
          value={ageRange}
          onChange={(next) => {
            const pruned =
              next.min === undefined && next.max === undefined
                ? undefined
                : next;
            emitKnown({ ageRange: pruned });
          }}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>성별</Label>
        <Select
          value={genderPresentation || UNSET}
          onValueChange={(next) =>
            emitKnown({
              genderPresentation:
                next === UNSET
                  ? undefined
                  : (next as GenderPresentation),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="성별 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>지정 안 함</SelectItem>
            {GENDER_PRESENTATIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>최소 참조 수</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={minReferenceCount ?? ''}
          onChange={handleMinReference}
          placeholder="예: 20"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Fallback 전략</Label>
        <Select
          value={fallbackStrategy || UNSET}
          onValueChange={(next) =>
            emitKnown({
              fallbackStrategy:
                next === UNSET ? undefined : (next as FallbackStrategy),
            })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Fallback 전략 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET}>지정 안 함</SelectItem>
            {FALLBACK_STRATEGIES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AdvancedJsonPanel
        value={extra}
        onChange={handleExtraChange}
        disabled={disabled}
      />
    </div>
  );
}
