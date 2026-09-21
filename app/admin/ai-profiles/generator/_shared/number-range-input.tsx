'use client';

import type { ChangeEvent } from 'react';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface Props {
  value: { min?: number; max?: number };
  onChange: (next: { min?: number; max?: number }) => void;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
}

function parseNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

export function NumberRangeInput({
  value,
  onChange,
  minLabel = '최소',
  maxLabel = '최대',
  disabled,
}: Props) {
  const handleMin = (event: ChangeEvent<HTMLInputElement>) => {
    const min = parseNumber(event.target.value);
    onChange({ ...value, min });
  };

  const handleMax = (event: ChangeEvent<HTMLInputElement>) => {
    const max = parseNumber(event.target.value);
    onChange({ ...value, max });
  };

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs text-slate-500">{minLabel}</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={value.min ?? ''}
          onChange={handleMin}
          placeholder="min"
          disabled={disabled}
        />
      </div>
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs text-slate-500">{maxLabel}</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={value.max ?? ''}
          onChange={handleMax}
          placeholder="max"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
